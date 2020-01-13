echo "$(date +%T)|started processes"

node src/server.js &
npm start &

echo "$(date +%T)|started processes"

while true; do
        running=$(jobs | wc -l)
        if [ $running -gt 1 ]; then
                echo "$(date +%T)|still $running running... sleeping"
                sleep 5
        else
                echo "$(date +%T)|only $running running now... ending loop"
                break
        fi
done
