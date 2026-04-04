from io import BytesIO
import pandas as pd

def parse_csv(file_bytes: bytes) -> pd.DataFrame:
    """Parse CSV bytes to DataFrame, raises ValueError if malformed."""
    try:
        df = pd.read_csv(BytesIO(file_bytes))
        return df
    except Exception as e:
        raise ValueError(f"Failed to parse CSV: {str(e)}")

def validate_columns(df: pd.DataFrame, required: list[str]) -> None:
    """Raises ValueError if columns are missing."""
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
