import requests

def test_get_results():
    result = requests.get("http://localhost:5001/api/v1/recipes/callIngredients/")
    assert result.status_code==200