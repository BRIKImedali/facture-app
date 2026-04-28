import urllib.request, json
import urllib.error

data = json.dumps({'username':'admin','password':'admin123'}).encode('utf-8')
req = urllib.request.Request('http://localhost:8080/api/auth/login', data=data, headers={'Content-Type': 'application/json'})
try:
    res = urllib.request.urlopen(req)
    token = json.loads(res.read())['token']
    req2 = urllib.request.Request('http://localhost:8080/api/admin/users?page=0&size=15&sortBy=username', headers={'Authorization': 'Bearer ' + token})
    res2 = urllib.request.urlopen(req2)
    print("Success:", res2.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print('Error:', e.code, e.read().decode('utf-8'))
except Exception as e:
    print("Other error:", e)
