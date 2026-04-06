from pydantic import BaseModel
from typing import List, Optional

class MetricResult(BaseModel):
    metric_name: str
    value: float
    severity: str  # GREEN, AMBER, RED
    threshold: str
    affected_groups: List[str]
    description: str

class FeatureImportance(BaseModel):
    feature_name: str
    mean_abs_shap: float
    is_protected_attribute: bool

class SHAPResult(BaseModel):
    top_features: List[FeatureImportance]
    protected_attr_in_top_k: bool
    protected_attrs_found: List[str] = []
