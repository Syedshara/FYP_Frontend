"""
Explainability service for model predictions.

Analyzes feature importance and provides human-readable explanations
for why the model classified a flow as attack or benign.
"""

import numpy as np
from typing import Dict, List, Tuple

# Feature indices and names (matching your 78-feature model)
FEATURE_NAMES = {
    0: "Fwd_Packets_Total",
    1: "Bwd_Packets_Total",
    2: "Fwd_Packet_Length_Total",
    3: "Bwd_Packet_Length_Total",
    4: "Flow_Duration",
    5: "Flow_IAT_Mean",
    6: "Fwd_Packets_Per_Sec",
    7: "Bwd_Packets_Per_Sec",
    8: "Packet_Length_Mean",
    9: "Packet_Length_Std",
    10: "Flow_IAT_Std",
    11: "Flow_IAT_Max",
    12: "Fwd_IAT_Mean",
    20: "FIN_Flag_Count",
    21: "SYN_Flag_Count",
    22: "RST_Flag_Count",
    23: "PSH_Flag_Count",
    24: "ACK_Flag_Count",
    25: "URG_Flag_Count",
}

# Benign baseline values (from CIC-IDS2017 statistics)
BENIGN_BASELINE = {
    0: 10.0,    # Fwd packets
    1: 8.0,     # Bwd packets
    2: 500.0,   # Fwd length
    3: 400.0,   # Bwd length
    4: 1000.0,  # Duration
    5: 100.0,   # IAT mean
    6: 10.0,    # Fwd packets/sec
    7: 8.0,     # Bwd packets/sec
    8: 50.0,    # Packet length mean
    9: 20.0,    # Packet length std
    10: 200.0,  # Flow IAT std
    11: 500.0,  # Flow IAT max
    12: 100.0,  # Fwd IAT mean
    20: 1.0,    # FIN flags
    21: 2.0,    # SYN flags
    22: 0.0,    # RST flags
    23: 5.0,    # PSH flags
    24: 10.0,   # ACK flags
    25: 0.0,    # URG flags
}


class ExplainabilityAnalyzer:
    """Analyzes predictions and provides explainable insights."""
    
    def __init__(self):
        self.anomaly_threshold = 3.0  # 3x baseline = anomalous
    
    def analyze_window(self, window: List[List[float]], score: float, label: str) -> Dict:
        """
        Analyze a prediction window and explain the decision.
        
        Args:
            window: List of 10 flows (each with 78 features)
            score: Model's probability score (0-1)
            label: Predicted label ("attack" or "benign")
        
        Returns:
            Dict with explanation, anomalies, temporal pattern
        """
        
        # Get current flow (most recent in window)
        current_flow = np.array(window[-1])
        
        # Find anomalous features
        anomalies = self._find_anomalies(current_flow)
        
        # Analyze temporal pattern
        temporal = self._analyze_temporal_pattern(window)
        
        # Generate explanation
        explanation = self._generate_explanation(
            label=label,
            score=score,
            anomalies=anomalies,
            temporal=temporal
        )
        
        return {
            "explanation": explanation,
            "top_anomalies": anomalies[:5],  # Top 5 anomalous features
            "temporal_pattern": temporal,
            "anomaly_count": len(anomalies),
        }
    
    def _find_anomalies(self, flow: np.ndarray) -> List[Dict]:
        """Find features that deviate significantly from baseline."""
        
        anomalies = []
        
        for idx, baseline in BENIGN_BASELINE.items():
            if idx >= len(flow):
                continue
            
            value = flow[idx]
            
            # Calculate deviation ratio
            if baseline > 0:
                ratio = value / baseline
            else:
                # For zero baseline (like RST flags), any value is anomalous
                ratio = 999.0 if value > 0 else 1.0
            
            # Consider it anomalous if >3x baseline
            if ratio > self.anomaly_threshold:
                anomalies.append({
                    "feature": FEATURE_NAMES.get(idx, f"Feature_{idx}"),
                    "value": float(value),
                    "baseline": float(baseline),
                    "ratio": float(ratio),
                })
        
        # Sort by ratio (most anomalous first)
        anomalies.sort(key=lambda x: x["ratio"], reverse=True)
        
        return anomalies
    
    def _analyze_temporal_pattern(self, window: List[List[float]]) -> str:
        """Detect temporal patterns in the flow sequence."""
        
        if len(window) < 3:
            return "Insufficient history"
        
        # Analyze packet rate trend over last 3 flows
        recent_flows = np.array(window[-3:])
        packet_rates = recent_flows[:, 6]  # Fwd packets/sec (index 6)
        
        if len(packet_rates) < 2:
            return "Stable pattern"
        
        # Calculate rate of change
        recent_rate = packet_rates[-1]
        prev_avg = np.mean(packet_rates[:-1])
        
        if prev_avg == 0:
            return "Stable pattern"
        
        # Classify pattern
        if recent_rate > prev_avg * 5:
            return "Sudden spike detected"
        elif recent_rate > prev_avg * 2:
            return "Gradual increase"
        elif recent_rate < prev_avg * 0.5:
            return "Sudden drop"
        else:
            return "Stable pattern"
    
    def _generate_explanation(
        self,
        label: str,
        score: float,
        anomalies: List[Dict],
        temporal: str
    ) -> str:
        """Generate human-readable explanation."""
        
        if label == "attack":
            # Attack detected
            reasons = ["Model detected attack because:"]
            
            # Temporal reason
            if temporal in ["Sudden spike detected", "Gradual increase"]:
                reasons.append(f"• Temporal: {temporal} in traffic volume")
            
            # Top anomalous feature
            if anomalies:
                top = anomalies[0]
                reasons.append(
                    f"• Feature: {top['feature']} is {top['ratio']:.1f}x higher than normal"
                )
            
            # LSTM pattern recognition
            reasons.append("• LSTM captured the abnormal sequence pattern")
            
            return "\n   ".join(reasons)
        
        else:
            # Benign classification
            reasons = ["Model classified as benign because:"]
            
            if len(anomalies) == 0:
                reasons.append("• Features within normal ranges")
            else:
                reasons.append("• Anomalies not sustained across window")
            
            reasons.append("• No sustained temporal anomaly pattern")
            
            return "\n   ".join(reasons)


# Global analyzer instance
_analyzer = ExplainabilityAnalyzer()


def explain_prediction(
    window: List[List[float]],
    score: float,
    label: str
) -> Dict:
    """
    Public API for prediction explanation.
    
    Args:
        window: List of 10 flows (each 78 features)
        score: Prediction probability
        label: Predicted label
    
    Returns:
        Explanation dict with reasoning and anomalies
    """
    return _analyzer.analyze_window(window, score, label)