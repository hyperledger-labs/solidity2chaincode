
set -e

export MSYS_NO_PATHCONV=1
starttime=$(date +%s)
LANGUAGE="node"

CHAINCODENAME="EIP20"
CC_SRC_PATH="/opt/gopath/src/github.com/output/${CHAINCODENAME}"

docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode install -n ${CHAINCODENAME} -v 1.0 -p "$CC_SRC_PATH" -l "$LANGUAGE"
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode instantiate -o orderer.example.com:7050 -C mychannel -n ${CHAINCODENAME} -l "$LANGUAGE" -v 1.0 -c '{"Args":["","${CHAINCODENAME}"]}'


printf "\nTotal setup execution time : $(($(date +%s) - starttime)) secs ...\n\n\n"
printf "tested chaincode has been started successfully'\n"
