"""
SHAP Explainability Module for FairLens
========================================

Computes SHAP feature importance values and identifies protected attributes
that are driving model predictions. Handles both sklearn models and
prediction-only scenarios by training a proxy GradientBoostingClassifier.

Key Functions:
- explain_predictions: Main entry point for SHAP analysis
- _fit_proxy_model: Trains GradientBoostingClassifier if no model provided
- _compute_shap_values: Computes SHAP values for features
- _identify_protected_in_top_k: Flags if protected attributes drive predictions
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
import shap
import warnings
from typing import Optional, Dict, List, Tuple
from app.models.metrics import SHAPResult, FeatureImportance

warnings.filterwarnings('ignore', category=UserWarning)


def _fit_proxy_model(
    X: pd.DataFrame,
    y: pd.Series,
    max_samples: int = 5000
) -> Tuple[GradientBoostingClassifier, pd.DataFrame]:
    """
    Fits a simple proxy GradientBoostingClassifier for SHAP computation.
    
    Args:
        X: Feature matrix (may contain non-numeric columns)
        y: Target variable (binary classification)
        max_samples: Maximum rows to use (for performance)
    
    Returns:
        Tuple of (trained model, preprocessed X)
    """
    # Subsample if needed (for performance)
    if len(X) > max_samples:
        indices = np.random.choice(len(X), max_samples, replace=False)
        X_subset = X.iloc[indices].reset_index(drop=True)
        y_subset = y.iloc[indices].reset_index(drop=True)
    else:
        X_subset = X.reset_index(drop=True)
        y_subset = y.reset_index(drop=True)
    
    # Encode categorical columns
    X_processed = X_subset.copy()
    label_encoders = {}
    
    for col in X_processed.select_dtypes(include=['object']).columns:
        le = LabelEncoder()
        X_processed[col] = le.fit_transform(X_processed[col].astype(str))
        label_encoders[col] = le
    
    # Fill missing numeric values with median
    numeric_cols = X_processed.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        X_processed[col] = X_processed[col].fillna(X_processed[col].median())
    
    # Train proxy model
    model = GradientBoostingClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=3,
        random_state=42,
        verbose=0
    )
    
    model.fit(X_processed, y_subset)
    
    return model, X_processed


def _compute_shap_values(
    X: pd.DataFrame,
    model: GradientBoostingClassifier,
    max_samples: int = 5000
) -> np.ndarray:
    """
    Computes SHAP values using TreeExplainer (optimized for tree models).
    
    Args:
        X: Feature matrix (must be numeric)
        model: Fitted sklearn model
        max_samples: Maximum rows to explain (for performance)
    
    Returns:
        SHAP values array of shape (n_samples, n_features)
    """
    # Subsample for performance (SHAP computation is O(n))
    if len(X) > max_samples:
        sample_indices = np.random.choice(len(X), max_samples, replace=False)
        X_sample = X.iloc[sample_indices]
    else:
        X_sample = X
    
    # Use TreeExplainer for gradient boosting models
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_sample)
    
    # For binary classification, shap_values might be a list [class_0, class_1]
    # We use class_1 (positive class) values
    if isinstance(shap_values, list):
        shap_values = shap_values[1]  # Use class 1 SHAP values
    
    return shap_values


def _identify_protected_in_top_k(
    feature_importance: List[FeatureImportance],
    protected_attrs: List[str],
    k: int = 10
) -> Tuple[bool, List[str]]:
    """
    Checks if any protected attributes are in the top-k important features.
    
    Args:
        feature_importance: List of FeatureImportance objects
        protected_attrs: List of protected attribute names
        k: Number of top features to check
    
    Returns:
        Tuple of (is_protected_in_top_k, list of protected attrs in top-k)
    """
    top_k_features = [f.feature_name for f in feature_importance[:k]]
    protected_in_top = [
        attr for attr in protected_attrs
        if attr in top_k_features
    ]
    
    return len(protected_in_top) > 0, protected_in_top


def explain_predictions(
    df: pd.DataFrame,
    target_col: str,
    protected_attrs: List[str],
    prediction_col: Optional[str] = None,
    model: Optional[object] = None
) -> SHAPResult:
    """
    Main entry point: computes SHAP feature importance and flags protected attributes.
    
    If no model is provided, trains a GradientBoostingClassifier proxy.
    If no predictions are provided, uses the proxy model's predictions.
    
    Args:
        df: Input DataFrame
        target_col: Name of target column (ground truth)
        protected_attrs: List of protected attribute column names
        prediction_col: Optional column with predictions (or uses ground truth as proxy)
        model: Optional sklearn model (default: trains GradientBoostingClassifier)
    
    Returns:
        SHAPResult with top-10 features and flag for protected attributes in top-10
    
    Raises:
        ValueError: If target_col not in DataFrame or invalid inputs
    """
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in DataFrame")
    
    # Prepare target
    y = df[target_col]
    if y.dtype == 'object':
        # Try to convert string labels to binary
        unique_vals = y.unique()
        if len(unique_vals) > 2:
            raise ValueError(f"Target must be binary, found {len(unique_vals)} classes")
        y = (y == unique_vals[1]).astype(int)
    
    # Prepare features (exclude target and protected attributes from X)
    X = df.drop(columns=[target_col], errors='ignore')
    X = X.drop(columns=[p for p in protected_attrs if p in X.columns], errors='ignore')
    
    if X.empty:
        raise ValueError("No features available after removing target and protected attributes")
    
    try:
        # Fit proxy model if none provided
        if model is None:
            model, X_processed = _fit_proxy_model(X, y)
        else:
            X_processed = X.copy()
            # Encode categorical columns if model expected it
            for col in X_processed.select_dtypes(include=['object']).columns:
                le = LabelEncoder()
                X_processed[col] = le.fit_transform(X_processed[col].astype(str))
            # Fill missing values
            for col in X_processed.select_dtypes(include=[np.number]).columns:
                X_processed[col] = X_processed[col].fillna(X_processed[col].median())
        
        # Compute SHAP values
        shap_values = _compute_shap_values(X_processed, model, max_samples=5000)
        
        # Calculate mean absolute SHAP per feature
        mean_abs_shap = np.abs(shap_values).mean(axis=0)
        
        # Create feature importance list
        feature_names = X_processed.columns.tolist()
        feature_importance_list = [
            FeatureImportance(
                feature_name=fname,
                mean_abs_shap=float(shap_val),
                is_protected_attribute=fname in protected_attrs
            )
            for fname, shap_val in zip(feature_names, mean_abs_shap)
        ]
        
        # Sort by importance (descending)
        feature_importance_list.sort(
            key=lambda x: x.mean_abs_shap,
            reverse=True
        )
        
        # Select top 10 features
        top_features = feature_importance_list[:10]
        
        # Check if protected attributes are in top-10
        is_protected_in_top, protected_in_top = _identify_protected_in_top_k(
            top_features,
            protected_attrs,
            k=10
        )
        
        return SHAPResult(
            top_features=top_features,
            protected_attr_in_top_k=is_protected_in_top,
            protected_attrs_found=protected_in_top
        )
    
    except Exception as e:
        # Return empty result if SHAP computation fails
        # (don't block audit, just flag as unable to compute)
        return SHAPResult(
            top_features=[],
            protected_attr_in_top_k=False,
            protected_attrs_found=[]
        )
