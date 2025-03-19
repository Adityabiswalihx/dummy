import asyncio
import aiohttp
from aiohttp import ClientSession
from bs4 import BeautifulSoup
import time

# List of URLs to scrape (replace these with actual targets)
URLS = [
    'https://example.com',
    'https://httpbin.org/html',
    'https://www.python.org',
    'https://www.wikipedia.org',
    # Add more URLs as needed
]

# Asynchronous function to fetch a single URL
async def fetch(session: ClientSession, url: str) -> str:
    try:
        async with session.get(url, timeout=10) as response:
            response.raise_for_status()  # Raise error for bad status codes
            print(f"Fetched: {url}")
            return await response.text()
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return ""

# Asynchronous function to process the HTML content
async def scrape(session: ClientSession, url: str):
    html = await fetch(session, url)
    if html:
        soup = BeautifulSoup(html, 'html.parser')
        title = soup.title.string if soup.title else 'No Title Found'
        print(f"Title from {url}: {title}")

# The main function to manage concurrent scraping
async def main(urls):
    start = time.time()

    # Create a connector with a limit on simultaneous connections
    connector = aiohttp.TCPConnector(limit_per_host=5)

    # Use a single session for all requests
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [scrape(session, url) for url in urls]
        await asyncio.gather(*tasks)

    duration = time.time() - start
    print(f"\nFinished scraping {len(urls)} sites in {duration:.2f} seconds")

# Run the scraper
if __name__ == '__main__':
    asyncio.run(main(URLS))
