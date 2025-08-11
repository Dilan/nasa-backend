## Description

  NASA backend API with EPIC (Earth Polychromatic Imaging Camera) integration

## Installation

  $ npm install

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
PORT=4200
VERSION=1.0.1
DEMO_KEY=TOt**************mho
```

You can get a free NASA API key from: https://api.nasa.gov/

## Running the app

development:

  $ npm run start

## API Endpoints

### EPIC Images
- `GET /api/v1/epic/available-dates` - Get EPIC available dates with images
- `GET /api/v1/epic` - Get EPIC images for a specific date
  - Query parameters:
    - `date` (optional): Date in YYYY-MM-DD format (defaults to today)
    - `natural` (optional): Boolean, true for natural images, false for enhanced (defaults to true)
- `GET /api/v1/epic/image/:identifier` - Get EPIC image png by identifier

## Test

unit tests:
  
  $ npm run test

test coverage:

  $ npm run test:cov

## Ansible (deployment)

  ansible-playbook -i "50.17.39.22," "./ansible/website.yaml" \
          -u ubuntu --private-key ~/.ssh/nimbleseal
