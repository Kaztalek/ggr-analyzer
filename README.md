# ggr-analyzer
> Analyzes replay data in `.ggr` files for Guilty Gear XX Accent Core Plus R

## Prerequisites
- [Bun](https://bun.com/docs)

## Setup
Install dependencies:
```bash
bun i
```
Create a `.env` file based on `.env.example`. It should have a comma-separated list of your replay directories.

## Running

### All replays
Run across the replays from the paths specified in `.env`:
```bash
bun .
```

#### Output
`reports/character-distribution.csv`: Ranks how many unique opponents you've faced for each character, and your win rate against them
`reports/opponent-distribution.csv`: Ranks your win rate against unique opponents

### Individual replay
Print stats on an individual replay file:
```bash
bun . path/to/replay.ggr
```
