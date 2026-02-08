import importlib
import os
import sys

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch):
    db_path = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_PATH", str(db_path))

    if "app.database" in sys.modules:
        importlib.reload(sys.modules["app.database"])
    else:
        import app.database  # noqa: F401

    if "migrate" in sys.modules:
        importlib.reload(sys.modules["migrate"])
    else:
        import migrate  # noqa: F401

    import migrate

    migrate.run_migrations("upgrade")

    if "app.main" in sys.modules:
        importlib.reload(sys.modules["app.main"])

    from app.main import app

    with TestClient(app) as test_client:
        yield test_client

    if os.path.exists(db_path):
        os.remove(db_path)
