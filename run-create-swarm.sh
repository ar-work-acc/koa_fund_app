#!/bin/bash

# Create a Swarm with 3 nodes; install Ubuntu Multipass first

echo 'Removing old nodes.'
multipass delete node1 node2 node3
multipass purge
multipass ls
echo

echo 'Creating nodes...'
multipass launch docker --name node1
multipass launch docker --name node2
multipass launch docker --name node3
echo 'Done creating nodes!'

echo 'Initialize Swarm.'
multipass exec node1 -- docker swarm init

JOIN_TOKEN=$(multipass exec node1 -- docker swarm join-token manager -q)
echo "Manager join token: ${JOIN_TOKEN}"

echo 'Node 2 joining as manager.'
multipass exec node2 -- docker swarm join --token "$JOIN_TOKEN" node1:2377

echo 'Node 3 joining as manager.'
multipass exec node3 -- docker swarm join --token "$JOIN_TOKEN" node1:2377
echo

echo multipass exec node1 -- docker node ls
echo 'Done!'
