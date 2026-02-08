from datetime import datetime


def test_list_emails(client):
    resp = client.get("/emails")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "subject" in data[0]


def test_filter_unread(client):
    resp = client.get("/emails?filter=unread")
    assert resp.status_code == 200
    data = resp.json()
    assert all(email["is_read"] is False for email in data)


def test_filter_archived(client):
    resp = client.get("/emails?filter=archived")
    assert resp.status_code == 200
    data = resp.json()
    assert all(email["is_archived"] is True for email in data)


def test_search(client):
    resp = client.get("/emails?search=Proposal")
    assert resp.status_code == 200
    data = resp.json()
    assert any("Proposal" in email["subject"] for email in data)


def test_create_update_delete_email(client):
    payload = {
        "recipient": {"name": "Jane Doe", "email": "jane.doe@business.com"},
        "subject": "Re: Proposal",
        "body": "Thanks for the details. Let us sync tomorrow.",
        "attachments": [],
    }

    create_resp = client.post("/emails", json=payload)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["recipient"]["email"] == "jane.doe@business.com"
    assert created["is_read"] is True

    update_resp = client.put(f"/emails/{created['id']}", json={"is_read": False})
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["is_read"] is False

    delete_resp = client.delete(f"/emails/{created['id']}")
    assert delete_resp.status_code == 204

    missing_resp = client.get(f"/emails/{created['id']}")
    assert missing_resp.status_code == 404


def test_date_format_is_iso(client):
    resp = client.get("/emails")
    assert resp.status_code == 200
    sample = resp.json()[0]["date"]
    datetime.fromisoformat(sample)
