import json
import time
import urllib.request
import urllib.error

import requests

BASE = 'http://127.0.0.1:5000'


def wait_for_server(timeout=5.0):
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(BASE + '/')
            if r.status_code == 200:
                return True
        except requests.exceptions.ConnectionError:
            time.sleep(0.2)
    return False


def test_posture_endpoint():
    assert wait_for_server(), 'Server did not start in time'

    payload = {'some': 'data'}
    r = requests.post(BASE + '/posture', json=payload)
    print('STATUS', r.status_code)
    print('BODY', r.json())
    assert r.status_code == 200
    j = r.json()
    assert j.get('feedback') is not None
    assert j.get('received') is True


if __name__ == '__main__':
    test_posture_endpoint()
    print('Test passed')
