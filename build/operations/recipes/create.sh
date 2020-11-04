#!/bin/bash

: 'CREATE FAST INFRASTRUCTURE
This will create/configure all resources based on configuration
'

# CONFIGURATION
    source ./config.sh

# LAUNCH
    setTitle "Creating Azure Services"

## EXECUTE Services
    
    initial_location=$location

    # Setup global services (global)
    source inputs.sh -l centralus -n $system-global-rg -rg $system-global-rg

    source $dir/services/create-rg.sh
    source $dir/services/create-dns.sh
    #source $dir/services/create-fd.sh
    #source $dir/services/create-fw.sh 

exit

    # Setup central services (centralus)
    source inputs.sh -l centralus

    source $dir/services/create-rg.sh
    #source $dir/services/create-st.sh
    #source $dir/services/create-cdn.sh

    # Setup regional services (westus, eastus)
    location=$initial_location

    source $dir/services/create-rg.sh
    source $dir/services/create-log.sh
    source $dir/services/create-asp.sh
    source $dir/services/create-app.sh
    source $dir/services/create-appi.sh