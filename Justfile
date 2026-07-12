set shell := ["bash", "-cu"]

default:
    @just --list

setup:
    mise trust -a
    mise install
    npm install

run:
    npm run dev

build:
    npm run build

preview:
    npm run preview

check:
    npm run build

shots:
    npm run shots
