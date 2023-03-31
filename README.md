<br>
<h1 align = "center" > Tackle Net Backend Project </h1>
<br>

<img src="https://badgen.net/badge/node/16.19.1/3988FB"/> <img src="https://badgen.net/badge/npm/8.19.3/3988FB"/> <img src="https://badgen.net/badge/openai/3.2.1/green"/> <img src="https://badgen.net/badge/chatgpt/turbo 3.5/green"/> <img src="https://badgen.net/badge/puppeteer/19.6.0/yellow"/> <img src="https://badgen.net/badge/ubuntu/22.10/orange"/> <img src="https://badgen.net/badge/docker/20.10.17/orange"/>

## Feature

- It can extract main information about the website including title, description, media link.

- It can find all the bait products by surfing all the pages recursively.

- It can extract product information including title, description, price, sku, all media link

## Install Guide

### Environment Setup

- BASE_URL       : `Base API URL`
- PORT           : `Port number`
- OPENAI_API_KEY : `Custom OpenAI API key`
- CHROMIUM       : `Path where chromium is installed.`
- TOKEN_SECRET   : `Jwt token to authenticate API`
- TIME_OUT       : `API response timeout`
### Start Project

#### On Local

- `npm run start`

- dev mode: `npm run dev`


#### Docker Setup

- Docker build: `docker-compose build`

- Docker run process: `docker-compose up -d`


## Explanation

1. Use puppeteer to fetch all content from the webpage and visit all subpages.

2. Use ChatGPT APIs, extract information from the content.

3. After getting all pages, filter product page.

4. Get detailed information from the product page
