#!/bin/bash

BASEDIR=$(dirname $0)

# Make sure we've sourced in nvm
. $HOME/.nvm/nvm.sh

# Now run the activity worksheet
nvm exec v4.1.0 ${BASEDIR}/bin/indexMarch2017-2018.js -r davesieh@gmail.com

