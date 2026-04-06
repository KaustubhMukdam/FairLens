import pandas as pd
import numpy as np

def scan_dataset(df: pd.DataFrame, protected_attrs: list[str], target_col: str) -> dict:
    """
    Scans the dataset for missing values, class imbalance, and target distribution across protected groups.
    """
    result = {}
    
    # Missing value flags
    missing_flags = df.isnull().sum().to_dict()
    result["missing_values"] = {k: int(v) for k, v in missing_flags.items() if v > 0}
    
    # Class imbalance ratio for target column
    if target_col in df.columns:
        target_counts = df[target_col].value_counts()
        if len(target_counts) > 1:
            ratio = target_counts.min() / target_counts.max()
        else:
            ratio = 1.0
        result["class_imbalance_ratio"] = float(ratio)
        result["target_distribution"] = {str(k): int(v) for k, v in target_counts.to_dict().items()}
    else:
        result["class_imbalance_ratio"] = 1.0
        result["target_distribution"] = {}
    
    # Value counts & target distribution per protected group
    result["protected_groups_stats"] = {}
    for attr in protected_attrs:
        if attr in df.columns:
            group_stats = {}
            # value counts
            counts = df[attr].value_counts().to_dict()
            group_stats["value_counts"] = {str(k): int(v) for k, v in counts.items()}
            
            # target distribution per group
            if target_col in df.columns:
                target_dist = df.groupby(attr)[target_col].value_counts(normalize=True).unstack(fill_value=0).to_dict(orient="index")
                # convert dict keys to strings and values to float for JSON safety
                group_stats["target_distribution_by_group"] = {
                    str(k): {str(sub_k): float(sub_v) for sub_k, sub_v in v.items()}
                    for k, v in target_dist.items()
                }
            
            result["protected_groups_stats"][attr] = group_stats
            
    return result
