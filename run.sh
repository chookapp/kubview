# (explaining the commented out code below)
# At first, I thought to run in development mode. 
# So I run both the "server" (which provides the data, but not the web page itself) and the "npm start" (which is the web server)
# But it turned out not to work...
# so now, I build it in production and the server serves both the web page itself (html, js) and the data (json)


node server.js



# echo "$(date +%T)|started processes"

# node src/server.js &
# npm start &

# echo "$(date +%T)|started processes"

# while true; do
#         running=$(jobs | wc -l)
#         if [ $running -gt 1 ]; then
#                 echo "$(date +%T)|still $running running... sleeping"
#                 sleep 5
#         else
#                 echo "$(date +%T)|only $running running now... ending loop"
#                 break
#         fi
# done