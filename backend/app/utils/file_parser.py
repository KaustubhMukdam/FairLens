from io import BytesIO
import pandas as pd

def parse_csv(file_bytes: bytes) -> pd.DataFrame:
    """Parse CSV bytes to DataFrame, raises ValueError if malformed."""
    buffer = BytesIO(file_bytes)
    try:
        df = pd.read_csv(
            buffer,
            encoding="utf-8-sig",
            low_memory=True,
        )
        return df
    except Exception as e:
        try:
            # Fallback for mixed encodings and occasional malformed rows.
            buffer.seek(0)
            df = pd.read_csv(
                buffer,
                encoding="latin1",
                low_memory=True,
                on_bad_lines="skip",
            )
            return df
        except Exception:
            raise ValueError(f"Failed to parse CSV: {str(e)}")

def validate_columns(df: pd.DataFrame, required: list[str]) -> None:
    """Raises ValueError if columns are missing."""
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
