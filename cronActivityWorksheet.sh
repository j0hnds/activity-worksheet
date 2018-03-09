#!/bin/bash

BASEDIR=$(dirname $0)

# Make sure we've sourced in nvm
. $HOME/.nvm/nvm.sh

# Now run the activity worksheet
nvm exec v4.1.0 ${BASEDIR}/bin/index.js -r jeff.campbell@bighornimaging.com,dhasha.campbell@bighornimaging.com,davesieh@gmail.com,briancampbell@me.com

