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
Run across the replays from the paths specified in `.env`:
```bash
bun .
```

Print stats on an individual replay file:
```bash
bun . path/to/replay.ggr
```
