#!/usr/bin/env python3
"""
API Testing Script for MultiSportApp
Run this to test if your API keys are working correctly
"""
import asyncio
import httpx
import os
from datetime import datetime

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# API Keys from environment
EVENTBRITE_PRIVATE_TOKEN = os.getenv("EVENTBRITE_PRIVATE_TOKEN")
TWITCH_CLIENT_ID = os.getenv("TWITCH_CLIENT_ID")  
TWITCH_CLIENT_SECRET = os.getenv("TWITCH_CLIENT_SECRET")
SPORTSDATAIO_API_KEY = os.getenv("SPORTSDATAIO_API_KEY")

async def test_eventbrite():
    """Test Eventbrite API"""
    print("🎪 Testing Eventbrite API...")
    
    if not EVENTBRITE_PRIVATE_TOKEN:
        print("❌ EVENTBRITE_PRIVATE_TOKEN not found in environment")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {EVENTBRITE_PRIVATE_TOKEN}",
            "Content-Type": "application/json",
        }
        
        params = {
            "q": "sports",
            "expand": "venue",
            "sort_by": "date",
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                "https://www.eventbriteapi.com/v3/events/search/",
                headers=headers,
                params=params,
            )
            
            if response.status_code == 200:
                data = response.json()
                event_count = len(data.get("events", []))
                print(f"✅ Eventbrite API working! Found {event_count} events")
                return True
            else:
                print(f"❌ Eventbrite API failed: {response.status_code} - {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Eventbrite API error: {str(e)}")
        return False

async def test_twitch():
    """Test Twitch API"""
    print("🎮 Testing Twitch API...")
    
    if not TWITCH_CLIENT_ID or not TWITCH_CLIENT_SECRET:
        print("❌ Twitch credentials not found in environment")
        return False
    
    try:
        # First, get access token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://id.twitch.tv/oauth2/token",
                data={
                    "client_id": TWITCH_CLIENT_ID,
                    "client_secret": TWITCH_CLIENT_SECRET,
                    "grant_type": "client_credentials"
                }
            )
            
            if token_response.status_code != 200:
                print(f"❌ Failed to get Twitch token: {token_response.status_code}")
                return False
            
            token_data = token_response.json()
            access_token = token_data["access_token"]
            
            # Test streams endpoint
            headers = {
                "Client-ID": TWITCH_CLIENT_ID,
                "Authorization": f"Bearer {access_token}",
            }
            
            streams_response = await client.get(
                "https://api.twitch.tv/helix/streams?first=5",
                headers=headers,
            )
            
            if streams_response.status_code == 200:
                data = streams_response.json()
                stream_count = len(data.get("data", []))
                print(f"✅ Twitch API working! Found {stream_count} live streams")
                return True
            else:
                print(f"❌ Twitch streams API failed: {streams_response.status_code}")
                return False
                
    except Exception as e:
        print(f"❌ Twitch API error: {str(e)}")
        return False

async def test_sportsdataio():
    """Test SportsData.io API"""
    print("🏈 Testing SportsData.io API...")
    
    if not SPORTSDATAIO_API_KEY:
        print("❌ SPORTSDATAIO_API_KEY not found in environment")
        return False
    
    try:
        params = {"key": SPORTSDATAIO_API_KEY}
        current_year = datetime.now().year
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Test NFL endpoint
            response = await client.get(
                f"https://api.sportsdata.io/v3/nfl/scores/json/Schedules/{current_year}",
                params=params,
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ SportsData.io API working! Found {len(data)} NFL games")
                return True
            elif response.status_code == 401:
                print("❌ SportsData.io API: Invalid API key")
                return False
            elif response.status_code == 403:
                print("❌ SportsData.io API: Access forbidden (check subscription)")
                return False
            else:
                print(f"❌ SportsData.io API failed: {response.status_code}")
                return False
                
    except Exception as e:
        print(f"❌ SportsData.io API error: {str(e)}")
        return False

async def test_weather():
    """Test Open-Meteo Weather API (should always work)"""
    print("🌤️ Testing Weather API...")
    
    try:
        params = {
            "latitude": 40.7128,  # New York
            "longitude": -74.0060,
            "current_weather": "true",
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params=params,
            )
            
            if response.status_code == 200:
                data = response.json()
                temp = data.get("current_weather", {}).get("temperature")
                print(f"✅ Weather API working! Current temp in NYC: {temp}°C")
                return True
            else:
                print(f"❌ Weather API failed: {response.status_code}")
                return False
                
    except Exception as e:
        print(f"❌ Weather API error: {str(e)}")
        return False

async def main():
    """Run all API tests"""
    print("🧪 Starting API Integration Tests...\n")
    
    tests = [
        test_eventbrite(),
        test_twitch(), 
        test_sportsdataio(),
        test_weather()
    ]
    
    results = await asyncio.gather(*tests, return_exceptions=True)
    
    passed = sum(1 for result in results if result is True)
    total = len(results)
    
    print(f"\n📊 Test Results: {passed}/{total} APIs working")
    
    if passed < total:
        print("\n🚨 Some APIs are not working. Check your API keys in .env file:")
        print("- EVENTBRITE_PRIVATE_TOKEN")
        print("- TWITCH_CLIENT_ID") 
        print("- TWITCH_CLIENT_SECRET")
        print("- SPORTSDATAIO_API_KEY")
        print("\n📝 Make sure to get valid keys from:")
        print("- Eventbrite: https://www.eventbrite.com/platform/api/")
        print("- Twitch: https://dev.twitch.tv/console/apps")  
        print("- SportsData.io: https://sportsdata.io/")
    else:
        print("🎉 All APIs are working! Your app should now receive data.")

if __name__ == "__main__":
    asyncio.run(main())
