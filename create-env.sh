#!/bin/bash

# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate

# Install dependencies from requirements.txt
pip install -r requirements.txt

cd ui

npm i