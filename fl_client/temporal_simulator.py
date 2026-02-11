"""
Temporal Attack Simulator — Generates realistic attack patterns with escalation.

Based on explainable attack simulation patterns that mimic real-world attack behavior:
  - DDoS attacks that escalate gradually
  - Port scans with rapid reconnection patterns
  - Slowloris attacks with sustained slow connections
  - Infiltration with slow exfiltration patterns

Supports temporal analysis by tracking attack intensity over time.
"""

from __future__ import annotations

import numpy as np
from typing import Optional, Tuple, Dict, Any
import logging

log = logging.getLogger("temporal_simulator")

# Feature indices for direct manipulation
FEATURE_IDX = {
    "fwd_packets": 0,
    "bwd_packets": 1,
    "fwd_length": 2,
    "bwd_length": 3,
    "flow_duration": 4,
    "flow_iat_mean": 5,
    "fwd_packets_sec": 6,
    "bwd_packets_sec": 7,
    "packet_length_mean": 8,
    "packet_length_std": 9,
    "flow_iat_std": 10,
    "flow_iat_max": 11,
    "fwd_iat_mean": 12,
    "fin_flag": 20,
    "syn_flag": 21,
    "rst_flag": 22,
    "psh_flag": 23,
    "ack_flag": 24,
    "urg_flag": 25,
}

NUM_FEATURES = 78


class TemporalAttackSimulator:
    """
    Generates network flows with temporal attack patterns.
    
    Supports escalating and sudden attacks with realistic intensity progression.
    
    Parameters
    ----------
    attack_type : str
        Type of attack: 'ddos', 'portscan', 'slowloris', 'infiltration', 'benign'
    escalation : bool
        If True, attack intensity grows gradually from 0 to 1 over time
        If False, attack starts at full intensity after start_flow
    start_flow : int
        Flow number when attack should begin
    max_intensity : float
        Maximum attack intensity (0.0-1.0)
    rng : np.random.Generator or None
        Random number generator for reproducibility
    """
    
    def __init__(
        self,
        attack_type: str = "benign",
        escalation: bool = True,
        start_flow: int = 20,
        max_intensity: float = 1.0,
        rng: Optional[np.random.Generator] = None,
    ):
        self.attack_type = attack_type.lower()
        self.escalation = escalation
        self.start_flow = start_flow
        self.max_intensity = max_intensity
        self.rng = rng if rng is not None else np.random.default_rng()
        self._flow_count = 0
    
    def generate_flow(self) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Generate a single flow with temporal attack progression.
        
        Returns
        -------
        (flow, metadata)
            flow: np.ndarray of shape (78,) - network flow features
            metadata: dict with attack_intensity, is_attack, etc.
        """
        self._flow_count += 1
        
        # Calculate current attack intensity
        intensity = self._calculate_intensity()
        is_attack = intensity > 0
        
        # Generate flow based on intensity
        if intensity > 0:
            if self.attack_type == "ddos":
                flow = self._ddos_flow(intensity)
            elif self.attack_type == "portscan":
                flow = self._portscan_flow(intensity)
            elif self.attack_type == "slowloris":
                flow = self._slowloris_flow(intensity)
            elif self.attack_type == "infiltration":
                flow = self._infiltration_flow(intensity)
            else:
                flow = self._benign_flow()
        else:
            flow = self._benign_flow()
        
        metadata = {
            "flow_num": self._flow_count,
            "attack_type": self.attack_type,
            "intensity": intensity,
            "is_attack": is_attack,
            "escalating": self.escalation,
        }
        
        return flow, metadata
    
    def _calculate_intensity(self) -> float:
        """Calculate current attack intensity based on flow count."""
        if self._flow_count < self.start_flow:
            return 0.0
        
        if not self.escalation:
            return self.max_intensity
        
        # Escalating intensity (linear ramp)
        flows_since_start = self._flow_count - self.start_flow
        escalation_rate = self.max_intensity / 30.0  # Reach max in 30 flows
        intensity = min(flows_since_start * escalation_rate, self.max_intensity)
        return intensity
    
    def _benign_flow(self) -> np.ndarray:
        """Generate normal IoT traffic."""
        flow = np.zeros(NUM_FEATURES, dtype=np.float32)
        
        # Normal packet rates
        flow[FEATURE_IDX["fwd_packets"]] = self.rng.normal(8, 3)
        flow[FEATURE_IDX["bwd_packets"]] = self.rng.normal(6, 2)
        flow[FEATURE_IDX["fwd_length"]] = self.rng.normal(500, 150)
        flow[FEATURE_IDX["bwd_length"]] = self.rng.normal(400, 120)
        
        # Normal rates
        flow[FEATURE_IDX["fwd_packets_sec"]] = self.rng.normal(10, 3)
        flow[FEATURE_IDX["bwd_packets_sec"]] = self.rng.normal(8, 2)
        
        # Normal packet sizes
        flow[FEATURE_IDX["packet_length_mean"]] = self.rng.normal(50, 15)
        flow[FEATURE_IDX["packet_length_std"]] = self.rng.normal(20, 8)
        
        # Normal timing
        flow[FEATURE_IDX["flow_iat_mean"]] = self.rng.normal(100, 30)
        flow[FEATURE_IDX["flow_iat_max"]] = self.rng.normal(500, 150)
        
        # Normal flags
        flow[FEATURE_IDX["ack_flag"]] = self.rng.normal(10, 2)
        flow[FEATURE_IDX["syn_flag"]] = self.rng.normal(1, 0.5)
        
        return np.clip(flow, 0, None).astype(np.float32)
    
    def _ddos_flow(self, intensity: float) -> np.ndarray:
        """
        Generate DDoS attack flow.
        
        DDoS characteristics:
        - Massive packet rates
        - Extreme byte volumes
        - Short duration
        - Minimal responses
        """
        flow = np.zeros(NUM_FEATURES, dtype=np.float32)
        
        # Intensity amplifies packet rates dramatically
        base_fwd_packets = 10
        base_bwd_packets = 2
        
        # Scale with intensity (linear 0->full DDoS)
        flow[FEATURE_IDX["fwd_packets"]] = base_fwd_packets + (1390 * intensity)
        flow[FEATURE_IDX["bwd_packets"]] = base_bwd_packets + (8 * intensity)
        
        # Packet volumes scale with intensity
        flow[FEATURE_IDX["fwd_length"]] = 500 + (149500 * intensity)
        flow[FEATURE_IDX["bwd_length"]] = 300 + (79600 * intensity)
        
        # Packet rates scale dramatically
        flow[FEATURE_IDX["fwd_packets_sec"]] = 10 + (1990 * intensity)
        flow[FEATURE_IDX["bwd_packets_sec"]] = 5 + (1492 * intensity)
        
        # Very short flow duration as attack intensifies
        flow[FEATURE_IDX["flow_duration"]] = 1000 - (800 * intensity)
        
        # Packet sizes decrease in flood
        flow[FEATURE_IDX["packet_length_mean"]] = 100 - (60 * intensity)
        flow[FEATURE_IDX["packet_length_std"]] = 30 - (20 * intensity)
        
        # Very low IAT (rapid fire packets)
        flow[FEATURE_IDX["flow_iat_mean"]] = 500 - (400 * intensity)
        flow[FEATURE_IDX["flow_iat_max"]] = 1000 - (800 * intensity)
        
        # Add noise proportional to values
        flow += np.abs(np.random.normal(0, flow * 0.05))
        
        return np.clip(flow, 0, None).astype(np.float32)
    
    def _portscan_flow(self, intensity: float) -> np.ndarray:
        """
        Generate Port Scan attack flow.
        
        Port scan characteristics:
        - Many connections to different ports
        - Small packet sizes
        - High SYN flags, low ACK flags
        - Rapid fire pattern
        """
        flow = np.zeros(NUM_FEATURES, dtype=np.float32)
        
        # Scanning = many small probe packets
        flow[FEATURE_IDX["fwd_packets"]] = 5 + (195 * intensity)
        flow[FEATURE_IDX["bwd_packets"]] = 2 + (8 * intensity)
        
        # Small packet volumes (probes)
        flow[FEATURE_IDX["fwd_length"]] = 200 + (3800 * intensity)
        flow[FEATURE_IDX["bwd_length"]] = 150 + (2850 * intensity)
        
        # Moderate to fast packet rates (scanning speed)
        flow[FEATURE_IDX["fwd_packets_sec"]] = 50 + (150 * intensity)
        flow[FEATURE_IDX["bwd_packets_sec"]] = 30 + (110 * intensity)
        
        # Short duration (quick scan)
        flow[FEATURE_IDX["flow_duration"]] = 500 - (300 * intensity)
        
        # Small packets in probe
        flow[FEATURE_IDX["packet_length_mean"]] = 40 + (20 * intensity)
        flow[FEATURE_IDX["packet_length_std"]] = 10 + (10 * intensity)
        
        # Low IAT (rapid scanning)
        flow[FEATURE_IDX["flow_iat_mean"]] = 20 + (10 * intensity)
        flow[FEATURE_IDX["flow_iat_max"]] = 100 + (50 * intensity)
        
        # High SYN flags (connection attempts)
        flow[FEATURE_IDX["syn_flag"]] = 10 + (90 * intensity)
        flow[FEATURE_IDX["ack_flag"]] = 5 - (4 * intensity)  # Low ACK responses
        flow[FEATURE_IDX["rst_flag"]] = 2 + (3 * intensity)  # Some RST responses
        
        flow += np.abs(np.random.normal(0, flow * 0.08))
        
        return np.clip(flow, 0, None).astype(np.float32)
    
    def _slowloris_flow(self, intensity: float) -> np.ndarray:
        """
        Generate Slowloris attack flow.
        
        Slowloris characteristics:
        - Few packets
        - Very slow transmission
        - Long-lived connections
        - Gradual resource exhaustion
        """
        flow = np.zeros(NUM_FEATURES, dtype=np.float32)
        
        # Very few packets (deliberate slowness)
        flow[FEATURE_IDX["fwd_packets"]] = 2 + (8 * intensity)
        flow[FEATURE_IDX["bwd_packets"]] = 1 + (3 * intensity)
        
        # Small volumes
        flow[FEATURE_IDX["fwd_length"]] = 300 + (200 * intensity)
        flow[FEATURE_IDX["bwd_length"]] = 200 + (100 * intensity)
        
        # Extremely slow packet rates (CRITICAL)
        flow[FEATURE_IDX["fwd_packets_sec"]] = 2 - (1.8 * intensity)
        flow[FEATURE_IDX["bwd_packets_sec"]] = 1 - (0.8 * intensity)
        
        # Very long flow duration (CRITICAL) - connection stays open
        flow[FEATURE_IDX["flow_duration"]] = 10000 + (110000 * intensity)
        
        # Normal-sized packets (not suspicious in size)
        flow[FEATURE_IDX["packet_length_mean"]] = 100 + (50 * intensity)
        flow[FEATURE_IDX["packet_length_std"]] = 20 + (10 * intensity)
        
        # Very high IAT (slow inter-arrival time) - CRITICAL
        flow[FEATURE_IDX["flow_iat_mean"]] = 1000 + (9000 * intensity)
        flow[FEATURE_IDX["flow_iat_max"]] = 5000 + (45000 * intensity)
        flow[FEATURE_IDX["fwd_iat_mean"]] = 5000 + (15000 * intensity)
        
        # Normal-looking flags
        flow[FEATURE_IDX["ack_flag"]] = self.rng.normal(5, 2)
        flow[FEATURE_IDX["syn_flag"]] = self.rng.normal(1, 0.5)
        
        flow += np.abs(np.random.normal(0, flow * 0.05))
        
        return np.clip(flow, 0, None).astype(np.float32)
    
    def _infiltration_flow(self, intensity: float) -> np.ndarray:
        """
        Generate Infiltration/Data Exfiltration flow.
        
        Infiltration characteristics:
        - Moderate, consistent traffic
        - Long duration connections
        - Steady data flow
        - Attempts to blend in
        """
        flow = np.zeros(NUM_FEATURES, dtype=np.float32)
        
        # Moderate packet counts (trying to blend in)
        flow[FEATURE_IDX["fwd_packets"]] = 15 + (50 * intensity)
        flow[FEATURE_IDX["bwd_packets"]] = 10 + (30 * intensity)
        
        # Moderate volumes
        flow[FEATURE_IDX["fwd_length"]] = 5000 + (45000 * intensity)
        flow[FEATURE_IDX["bwd_length"]] = 3000 + (27000 * intensity)
        
        # Steady, consistent rates
        flow[FEATURE_IDX["fwd_packets_sec"]] = 20 + (30 * intensity)
        flow[FEATURE_IDX["bwd_packets_sec"]] = 15 + (20 * intensity)
        
        # Very long duration (sustained connection)
        flow[FEATURE_IDX["flow_duration"]] = 50000 + (450000 * intensity)
        
        # Medium packet sizes
        flow[FEATURE_IDX["packet_length_mean"]] = 150 + (100 * intensity)
        flow[FEATURE_IDX["packet_length_std"]] = 40 + (30 * intensity)
        
        # Steady IAT
        flow[FEATURE_IDX["flow_iat_mean"]] = 200 + (300 * intensity)
        flow[FEATURE_IDX["flow_iat_max"]] = 1000 + (2000 * intensity)
        
        # Looks mostly normal
        flow[FEATURE_IDX["ack_flag"]] = self.rng.normal(15, 3)
        flow[FEATURE_IDX["syn_flag"]] = self.rng.normal(1, 0.5)
        
        flow += np.abs(np.random.normal(0, flow * 0.06))
        
        return np.clip(flow, 0, None).astype(np.float32)
    
    def reset(self) -> None:
        """Reset the flow counter."""
        self._flow_count = 0
        log.info("TemporalAttackSimulator reset")


class TemporalAttackGenerator:
    """
    Generates a sequence of attacks with different types and timings.
    
    Cycles through different attack types automatically.
    """
    
    def __init__(self, rng: Optional[np.random.Generator] = None):
        self.rng = rng if rng is not None else np.random.default_rng()
        self.current_simulator = None
        self.attack_sequence = [
            ("benign", 0, False),           # Normal traffic
            ("ddos", 20, True),             # Escalating DDoS
            ("benign", 50, False),          # Return to normal
            ("portscan", 20, False),        # Sudden portscan
            ("benign", 30, False),          # Normal
            ("slowloris", 25, True),        # Escalating slowloris
            ("benign", 40, False),          # Normal
            ("infiltration", 30, True),     # Escalating exfiltration
        ]
        self.current_attack_idx = 0
        self.attack_flows = 0
        self._initialize_attack()
    
    def _initialize_attack(self) -> None:
        """Initialize the current attack type."""
        attack_type, start_flow, escalation = self.attack_sequence[self.current_attack_idx]
        self.current_simulator = TemporalAttackSimulator(
            attack_type=attack_type,
            escalation=escalation,
            start_flow=start_flow,
            rng=self.rng,
        )
        self.attack_flows = 0
        log.info(
            "Starting attack: %s (escalation=%s, start_flow=%d)",
            attack_type, escalation, start_flow,
        )
    
    def generate_flow(self) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Generate next flow and rotate attacks periodically."""
        flow, metadata = self.current_simulator.generate_flow()
        self.attack_flows += 1
        
        # Rotate attacks after ~100 flows per attack
        if self.attack_flows > 100:
            self.current_attack_idx = (self.current_attack_idx + 1) % len(self.attack_sequence)
            self._initialize_attack()
        
        return flow, metadata
    
    def reset(self) -> None:
        """Reset to first attack."""
        self.current_attack_idx = 0
        self.attack_flows = 0
        self._initialize_attack()
