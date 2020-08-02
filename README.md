# Dobkap
## Description
Dobkap is a tool for automating PP-OPO dividend tax filings in Serbia. It can import dividend payout data from an InteractiveBrokers activity statement and produce PP-OPO forms in ePorezi XML format.

## Features
- Supports Withholding Tax deductions
- Supports EUR, GBP and USD trading currencies, with more to come. Historic exchange rates are pulled from the National Bank of Serbia.

## Configuration
- Dobkap must be configured using a configuration file
- Dobkap will search the following paths for the configuration file:
  - The path given in the `-c` parameter
  - `./dobkap.conf`
  - `~/dobkap.conf`
- Here is an example configuration file:
```
{
  "jmbg": "1234567890123",
  "fullName": "Jован Jовановић",
  "streetAddress": "Terazije 1/1",
  "opstinaCode": "016",
  "phoneNumber": "0611111111",
  "email": "jovan@example.com",
  "realizationMethod": "Isplata na brokerski racun",
  "holidays": [
    "2020-01-01",
    "2020-01-01",
    "2020-01-07",
    "2020-02-15",
    "2020-02-16",
    "2020-02-17",
    "2020-04-17",
    "2020-04-18",
    "2020-04-19",
    "2020-04-20",
    "2020-05-01",
    "2020-05-02",
    "2020-11-11"
  ],
  "holidayRangeStart": "2020-01-01",
  "holidayRangeEnd": "2020-12-31"
}
```

## Usage
Import an InteractiveBrokers activity statement from `U1234567_20200714.csv` and write the PP-OPO XML to the current directory
```
dobkap import -i U1234567_20200714.csv -m ibkr
```
Import an InteractiveBrokers activity statement from `U1234567_20200714.csv` and write the PP-OPO XML to the `/some/path` directory
```
dobkap import -i U1234567_20200714.csv -o /some/path -m ibkr
```
