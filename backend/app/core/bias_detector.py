import pandas as pd
import numpy as np
from fairlearn.metrics import (
    demographic_parity_difference,
    equalized_odds_difference,
    MetricFrame,
    selection_rate
)
from sklearn.metrics import precision_score
from sklearn.neighbors import NearestNeighbors
from functools import partial
from app.models.metrics import MetricResult

def _compute_knn_consistency(numeric_X: pd.DataFrame, y_pred: np.ndarray, k: int = 5) -> float:
    if numeric_X.empty or len(numeric_X) < k:
        return 0.0
        
    knn = NearestNeighbors(n_neighbors=k)
    knn.fit(numeric_X)
    _, indices = knn.kneighbors(numeric_X)
    
    consistency = 0.0
    for i in range(len(y_pred)):
        neighbor_preds = y_pred[indices[i]]
        target_pred = y_pred[i]
        consistency += np.mean(neighbor_preds == target_pred)
        
    consistency /= len(y_pred)
    return 1.0 - consistency

def compute_fairness_metrics(
    y_true: pd.Series, 
    y_pred: pd.Series, 
    sensitive_features: pd.DataFrame,
    X: pd.DataFrame = None
) -> list[MetricResult]:
    """
    Computes 5 fairness metrics based on ground truth, predictions, and sensitive features.
    """
    results = []
    
    # We aggregate the maximum violation across all specified sensitive attributes
    if len(sensitive_features.columns) == 0:
        return []
        
    # Let's compute for the first attribute to keep report simple for Phase 2, 
    # as typically we focus on the primary protected attribute defined.
    primary_attr = sensitive_features.columns[0]
    sf_primary = sensitive_features[primary_attr]
    groups = [str(g) for g in sf_primary.unique()]
    
    # 1. Demographic Parity
    try:
        dp_val = demographic_parity_difference(y_true, y_pred, sensitive_features=sf_primary)
    except Exception:
        dp_val = 0.0
        
    results.append(MetricResult(
        metric_name="Demographic Parity Violation",
        value=float(dp_val),
        severity="RED" if dp_val > 0.2 else ("AMBER" if dp_val > 0.1 else "GREEN"),
        threshold="< 0.1",
        affected_groups=groups,
        description="Measures difference in selection rates across demographic groups."
    ))
    
    # 2. Equalized Odds
    try:
        eo_val = equalized_odds_difference(y_true, y_pred, sensitive_features=sf_primary)
    except Exception:
        eo_val = 0.0
        
    results.append(MetricResult(
        metric_name="Equalized Odds Violation",
        value=float(eo_val),
        severity="RED" if eo_val > 0.2 else ("AMBER" if eo_val > 0.1 else "GREEN"),
        threshold="< 0.1",
        affected_groups=groups,
        description="Measures difference in true positive and false positive rates."
    ))
    
    # 3. Predictive Parity (Precision)
    safe_precision = partial(precision_score, zero_division=0)
    try:
        mf_prec = MetricFrame(metrics=safe_precision, y_true=y_true, y_pred=y_pred, sensitive_features=sf_primary)
        pp_val = mf_prec.difference(method="between_groups")
        if pd.isna(pp_val):
            pp_val = 0.0
    except Exception:
        pp_val = 0.0
        
    results.append(MetricResult(
        metric_name="Predictive Parity Violation",
        value=float(pp_val),
        severity="RED" if pp_val > 0.2 else ("AMBER" if pp_val > 0.1 else "GREEN"),
        threshold="< 0.1",
        affected_groups=groups,
        description="Measures difference in precision across groups."
    ))
    
    # 4. Disparate Impact
    try:
        mf_sel = MetricFrame(metrics=selection_rate, y_true=y_true, y_pred=y_pred, sensitive_features=sf_primary)
        sel_min = mf_sel.group_min()
        sel_max = mf_sel.group_max()
        di_val = sel_min / sel_max if sel_max > 0 else 1.0
        if pd.isna(di_val):
            di_val = 1.0
    except Exception:
        di_val = 1.0
    
    results.append(MetricResult(
        metric_name="Disparate Impact",
        value=float(di_val),
        severity="RED" if di_val < 0.8 else "GREEN",  # 80% rule
        threshold="> 0.8",
        affected_groups=groups,
        description="Ratio of selection rates (min/max). Below 0.8 typically signals disparate impact."
    ))
    
    # 5. Individual Fairness proxy
    if_viol = 0.0
    if X is not None:
        numeric_X = X.select_dtypes(include=[np.number])
        if not numeric_X.empty:
            k = min(5, len(numeric_X))
            y_pred_np = y_pred.values if isinstance(y_pred, pd.Series) else np.array(y_pred)
            if_viol = _compute_knn_consistency(numeric_X, y_pred_np, k=k)
            
    results.append(MetricResult(
        metric_name="Individual Fairness Violation",
        value=float(if_viol),
        severity="RED" if if_viol > 0.2 else ("AMBER" if if_viol > 0.1 else "GREEN"),
        threshold="< 0.1",
        affected_groups=groups,
        description="Proxy based on k-NN consistency. Checks if similar inputs receive similar predictions."
    ))
    
    return results
