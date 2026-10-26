from pathlib import Path

from scripts import run_api


def test_missing_docker_removes_stale_evidence_and_returns_setup_error(
    tmp_path, monkeypatch
):
    reports = tmp_path / "reports" / "api-regression"
    reports.mkdir(parents=True)
    for name in (
        "report.html",
        "junit.xml",
        "pytest.log",
        "services.log",
        "environment.txt",
    ):
        (reports / name).write_text("stale success", encoding="utf-8")
    monkeypatch.setattr(run_api, "__file__", str(tmp_path / "scripts" / "run_api.py"))
    monkeypatch.setattr("sys.argv", ["run_api.py"])

    def unavailable(*args, **kwargs):
        raise FileNotFoundError("docker unavailable")

    monkeypatch.setattr(run_api.subprocess, "run", unavailable)
    assert run_api.main() == 2
    assert not list(Path(reports).iterdir())
