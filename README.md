## Description

  NASA backend API with EPIC (Earth Polychromatic Imaging Camera) integration

## Installation

  $ npm install

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# NASA API Configuration
NASA_API_KEY=DEMO_KEY

# Add your actual NASA API key here when you have one
# NASA_API_KEY=your_actual_api_key_here
```

You can get a free NASA API key from: https://api.nasa.gov/

## Running the app

development:

  $ npm run start

## API Endpoints

### EPIC Images
- `GET /epic` - Get EPIC images for a specific date
  - Query parameters:
    - `date` (optional): Date in YYYY-MM-DD format (defaults to today)
    - `natural` (optional): Boolean, true for natural images, false for enhanced (defaults to true)
- `GET /epic/latest` - Get the latest EPIC images
- `GET /epic/identifier/:identifier` - Get a specific EPIC image by identifier

## Test

unit tests:
  
  $ npm run test

e2e tests:
  
  $ npm run test:e2e

test coverage:

  $ npm run test:cov

