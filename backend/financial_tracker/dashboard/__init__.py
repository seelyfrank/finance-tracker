"""
 File: project/dashboard/__init__.py
 Author: Frank Seely (fseely@bu.edu), 4/27/2026
 Description: Init file used to mark the dashboard directory as a 
 package so that we can import this code into our view cleanly.
"""


from .calculations import get_net_amount, get_category_breakdown
from .summary import build_summary_data, build_future_payments

