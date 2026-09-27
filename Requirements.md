# About
i want to track my fuel expenses for my car.

# Platform
- Android

# Tools
- React
- Capacitor
- Tailwind

# Build Requirements
- APK generator without opening android studio
- Unit tests

# Storage
- Localstorage

# App features
- Track fuel bought
- Track at what mileage the fuel is being bought or trip reading
- calculates fuel efficiency between the last bought mileage and the new one. and calculate fuel per liter used
- Estimate how long the entered fuel will last
- Have a setting for entering current fuel price once
- Have a section to show monthly fuel usage

# Fuel log workflow
- Click some button
- Enter date(defaults to current)
- Enter mileage (optional)
- Enter liters bought / Cash (Auto convert cash to liters based on global fuel price per liter)
- Save
- Calculate current mileage with previous recorded mileage to determine efficiency per KM

# Dashboard presentaton
- Large button to log fuel
- Show current budget for that month
- Show current amount spent in that month
- Calculate cost per day based on average weekly mileage and global fuel price