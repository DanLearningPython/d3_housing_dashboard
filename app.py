# -*- coding: utf-8 -*-

import pandas as pd

from flask import Flask
from flask import render_template
import json
import os


data_path = './input/'


def get_bedroom_segment(bedrooms):
    if bedrooms <= 0:
        return '0'
    elif bedrooms <= 2:
        return '1-2'
    elif bedrooms <= 4:
        return '3-4'
    elif bedrooms <= 6:
        return '5-6'
    elif bedrooms <= 8:
        return '7-8'
    else:
        return '9+'


app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/data")
def get_data():
    # needed for osx
    dir_path = os.path.dirname(os.path.realpath(__file__))
    housing_data = pd.read_csv(dir_path+'/input/kc_house_data.csv')
    housing_data['bedroom_segment'] = housing_data['bedrooms'].apply(lambda bedrooms: get_bedroom_segment(bedrooms))

    cols_to_keep = ["date", "price", "bedrooms", "bedroom_segment", "bathrooms", "sqft_living", "sqft_lot", "floors",
                    "waterfront", "view", "condition", "grade", "sqft_above", "sqft_basement", "yr_built",
                    "yr_renovated", "zipcode", "lat", "long"]

    df_clean = housing_data[cols_to_keep].dropna()

    return df_clean.to_json(orient='records')


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=1338, debug=True)