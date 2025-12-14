# Posture Flask Service

Simple Flask app with a `/posture` endpoint that accepts JSON pose landmarks and returns simple feedback. Includes a health check at `/`.

Requirements

- Python 3.8+

Install

```powershell
python -m pip install -r requirements.txt
```

Run

```powershell
& "C:/Users/Archismita Sanyal/AppData/Local/Programs/Python/Python313/python.exe" app.py
```

Test

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:5000/posture -Body '{"some":"data"}' -ContentType 'application/json'
```

