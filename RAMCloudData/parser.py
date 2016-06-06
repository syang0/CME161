import glob
import re

# group 1 is server/client/coordinator tag
# group 2 is server name (i.e. rc21)
rightKindaFileRegex = re.compile("./logs/(client|server|coordinator)[^\.]*\.([^\.]+).log")

# group 1 is time in seconds.nanoseconds
# group 2 is RPC type
# group 3 is request|response
# group 4 is transport (tcp/infrc)
# group 5 is serverip/hostname
# group 6 is number of bytes in request
sendRegex = re.compile("([\d]+\.[^ ]+) .* Sending (.*) (response|request) to ([^\:]+):host=([^,]+).* with (\d+) bytes")
recvRegex = re.compile("([\d]+\.[^ ]+) .* Received ([^ ]+) (request|response) from ([^\:]+):host=([^,]+).* with (\d+) bytes")

allMessages = []
junkMsgs = [] # for debugging
logFiles = glob.glob("./logs/*.log")

machineToType = {} # maps machine # to type #
for logFile in logFiles:

  # Only open files we are interested in
  match = rightKindaFileRegex.match(logFile)
  if match:
    with open(logFile) as f:
      machineType = match.group(1)
      thisServer = match.group(2)
      machineToType[thisServer] = machineType

      # For every line, search for a send or a recv and add them to the list.
      for line in f.readlines():
        sendMatch = sendRegex.match(line)
        recvMatch = recvRegex.match(line)

        # Put them into tuples of (time, opcode, send|recv, req|res, from, to, bytes)
        if sendMatch:
          toServer = "rc" + sendMatch.group(5)[-2:]
          tuple = (sendMatch.group(1), sendMatch.group(2), "send", sendMatch.group(3)[0:3], thisServer, toServer, sendMatch.group(6))
          allMessages.append(tuple);
        elif recvMatch:
          fromServer = "rc" + recvMatch.group(5)[-2:]
          tuple = (recvMatch.group(1), recvMatch.group(2), "recv", recvMatch.group(3)[0:3], fromServer, thisServer, recvMatch.group(6))
          allMessages.append(tuple);
        else:
          junkMsgs.append(line);

# Time sort the messages
timeSortedMsgs = sorted(allMessages, key=lambda msg: msg[0])

# Now that we have all the messages in time-sorted order, we can start processing them
def filterFunction(msg):
  # First, let's get rid of any messages routed through localhost (i.e. messages to/from the same machine) as they're not interesting
  if (msg[4] == msg[5]):
    return False

  return True

filteredMsgs = [msg for msg in timeSortedMsgs if filterFunction(msg)]

# Next, we correlate send events with recv events in the corresponding machines to get network delays.
correlationIndexes = []

# fill correlation index with invalid (i.e -1)
for msg in filteredMsgs:
  correlationIndexes.append(-1)


for idx, msg in enumerate(filteredMsgs):
  if msg[2] == "recv":
    if correlationIndexes[idx] == -1:
      continue

  if msg[2] == "send":
    # try to find a match with a recv; if not, let it overrun and fail
    nextId = idx + 1
    while nextId < len(filteredMsgs):
      potentialRecv = filteredMsgs[nextId]
      # if it's a recv with the same sender/recevers
      if correlationIndexes[nextId] == -1 and potentialRecv[2] == "recv" and potentialRecv[1] == msg[1] and potentialRecv[3] == msg[3] and potentialRecv[4] == msg[4] and potentialRecv[5] == msg[5]:
        correlationIndexes[idx] = nextId
        correlationIndexes[nextId] = idx
        # print "matched %d with %d" % (idx, nextId)
        break

      nextId += 1

# Debug: print all uncorrelated messages
uncorrelatedCnt = 0
for idx, correlation in enumerate(correlationIndexes):
  if correlation == -1:
    uncorrelatedCnt += 1
    print filteredMsgs[idx]

assert uncorrelatedCnt == 0

# # Print out all the machine roles
# print"{ \"machines\":["
# cnt = 0
# for k, v in machineToType.iteritems():
#   if (cnt > 0):
#     print(",")
#   print "{\"id\":%s, \"type\":\"%s\"}" % (k[-2:], v)
#   cnt += 1
# print"],"

# # Print out all the messages

# # Group 1: secs
# # Group 2: nsecs
# timeSplitterRegex = re.compile("([\d]+)\.([^ ]+)")

# timeBegin = timeSplitterRegex.match(filteredMsgs[0][0])
# beginSec = int(timeBegin.group(1))
# beginNsec = int(timeBegin.group(2))
# numLinesOutput = 0
# print "\"messages\":["
# for idx, coIdx in enumerate(correlationIndexes):
#   if coIdx < idx:
#     continue # Should already be printed

#   if numLinesOutput > 0:
#     print ","

#   msg1 = filteredMsgs[idx]
#   msg2 = filteredMsgs[coIdx]

#   timeStart = timeSplitterRegex.match(msg1[0])
#   timeEnd = timeSplitterRegex.match(msg2[0])

#   startSec = int(timeStart.group(1))
#   startNSec = int(timeStart.group(2))
#   endSec = int(timeEnd.group(1))
#   endNsec = int(timeEnd.group(2))

#   relStartSec = startSec - beginSec
#   relStartNSec = startNSec - beginNsec

#   durationSec = endSec - startSec
#   durationNSec = endNsec - startNSec

#   # Change everything to microseconds to make it useful (anything less is typically due to time skew anyway)
#   relStartUs = round((relStartSec*1e9 + relStartNSec)/1e3)
#   durationUs = round((durationSec*1e9 + durationNSec)/1e3)


#   # In RAMCloud, the machine numbers go from rc01-rc80. This prunes off the rc for easier client processing.
#   fromMachine = msg1[4][-2:]
#   toMachine = msg1[5][-2:]

#   print "{\"relStart\":%d, \"duration\":%d, \"opcode\":\"%s\", \"type\":\"%s\", \"from\":%s, \"to\":%s, \"size\":%s}" % (relStartUs, durationUs, msg1[1], msg1[3], fromMachine, toMachine, msg1[6])
#   numLinesOutput += 1
# print"]}"


# Materialize correlations

# Group 1: secs
# Group 2: nsecs
timeSplitterRegex = re.compile("([\d]+)\.([^ ]+)")

timeBegin = timeSplitterRegex.match(filteredMsgs[0][0])
beginSec = int(timeBegin.group(1))
beginNsec = int(timeBegin.group(2))


rpcs = []
for idx, coIdx in enumerate(correlationIndexes):
  if coIdx < idx:
    continue # Should already be printed

  msg1 = filteredMsgs[idx]
  msg2 = filteredMsgs[coIdx]

  timeStart = timeSplitterRegex.match(msg1[0])
  timeEnd = timeSplitterRegex.match(msg2[0])

  startSec = int(timeStart.group(1))
  startNSec = int(timeStart.group(2))
  endSec = int(timeEnd.group(1))
  endNsec = int(timeEnd.group(2))

  relStartSec = startSec - beginSec
  relStartNSec = startNSec - beginNsec

  durationSec = endSec - startSec
  durationNSec = endNsec - startNSec

  # Change everything to microseconds to make it useful (anything less is typically due to time skew anyway)
  relStartUs = round((relStartSec*1e9 + relStartNSec)/1e3)
  durationUs = round((durationSec*1e9 + durationNSec)/1e3)


  # In RAMCloud, the machine numbers go from rc01-rc80. This prunes off the rc for easier client processing.
  fromMachine = msg1[4][-2:]
  toMachine = msg1[5][-2:]

  newDict = {
    "relStart":relStartUs,
    "duration":durationUs,
    "opcode":msg1[1],
    "type":msg1[3],
    "from":fromMachine,
    "to":toMachine,
    "size":msg1[6],
    "correspondingRpc":-1,
    "endToEnd":0
  }

  rpcs.append(newDict)



# Now that we've correlated the send/recv events into distinct rpcs with durations, we need to do another correlation
# for the send/recv rpcs we've produced so that we can get the end to end latencies.
for idx, rpc in enumerate(rpcs):
  if rpc["type"] == "req":
    # look for the corresponding recv
    nextId = idx + 1
    while nextId < len(rpcs):
      potRpc = rpcs[nextId]
      if potRpc["correspondingRpc"] == -1 and potRpc["type"] == "res" and potRpc["opcode"] == rpc["opcode"] and potRpc["to"] == rpc["from"] and potRpc["from"] == rpc["to"]:
        endToEndLatency = potRpc["relStart"] - rpc["relStart"] + potRpc["duration"]

        potRpc["correspondingRpc"] = idx
        potRpc["endToEnd"] = endToEndLatency

        rpc["correspondingRpc"] = nextId
        rpc["endToEnd"] = endToEndLatency


        break
      nextId += 1

# Debug: print all uncorrelated messages
uncorrelatedCnt = 0
for rpc in rpcs:
  if rpc["correspondingRpc"] == -1:
    uncorrelatedCnt += 1
    print rpc

assert uncorrelatedCnt == 0


# At this point all the rpcs are correlated with each other, we can start outputing the final JSON.

# Print out all the machine roles
print"{ \"machines\":["
cnt = 0
for k, v in machineToType.iteritems():
  if (cnt > 0):
    print(",")
  print "\t{\"id\":%s, \"type\":\"%s\"}" % (k[-2:], v),
  cnt += 1
print""
print"\t],"

# Print out all the rpcs
cnt = 0
print "\"messages\":["
for rpc in rpcs:
  if cnt > 0:
    print ","

  print "\t{",
  firstItem = True
  for k, v in rpc.iteritems():
    if not firstItem:
      print ",",

    if isinstance(v, float):
      print "\"%s\":%.0lf" % (k, v),
    elif str(v).isdigit():
      print "\"%s\":%s" % (k, v),
    else:
      print "\"%s\":\"%s\"" % (k, v),

    firstItem = False

  print "}",
  cnt += 1

print ""
print "\t]"
print "}"

