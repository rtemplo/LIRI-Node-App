//MAIN KEY COLLECTION
var keys = require("./keys.js");

    //Twitter Object
    var Twitter = require("twitter");
    var client = new Twitter({
          consumer_key:keys.twitterKeys.consumer_key,
          consumer_secret:keys.twitterKeys.consumer_secret,
          access_token_key: keys.twitterKeys.access_token_key,
          access_token_secret: keys.twitterKeys.access_token_secret
    });

    //Spotify Object
    var Spotify = require("node-spotify-api"); 
    var spotify = new Spotify({
      id: keys.spotifyKeys.client_id,
      secret: keys.spotifyKeys.client_secret
    });

//Used for the OMDB API request
var request = require("request");

//For reading random.txt and for logging to log.txt
var fs = require("fs");

var command, genericParam; //user inputs argv[3] and argv[4] respectively

function init() {
    command = process.argv[2].trim();

    //in case no title was passed from the commmand line set it to blank otherwise ensure there are no spaces.
    if (process.argv[3] === undefined) {
        genericParam = "" 
    } else {
        genericParam = process.argv[3].trim();
    }   

    main();
}

//Main line (controller) function - invoked either by init() or readRandom()
function main() {
    //Accepted command line commands
    var validCommands = [
        "my-tweets",
        "spotify-this-song",
        "movie-this",
        "do-what-it-says",
        "test-tweet"
    ];

    if (validCommands.indexOf(command) >= 0) {

        switch(command) {
            case "my-tweets":
                getRecentTweets();
                break;
            case "spotify-this-song":
                getSpotifyData(genericParam);
                break;
            case "movie-this":
                getOMDBData(genericParam);
                break;        
            case "do-what-it-says":
                break;
            case "test-tweet":
                sendTestTweet(genericParam);
                break;
            default:
                break;
        }

    } else {
        console.log("### Sorry. You did not pass a valid command. ###");
    }
}

//Process Functions Below

function getRecentTweets() {
    var tweetLimit = 20; 
    client.get('statuses/user_timeline', {screen_name:"GrayPolyCode", count:tweetLimit}, function(error, tweets, response) {

        //in case there are less than 20 tweets in the last 7 days set the limit to whatever is returned.
        if (tweetLimit > tweets.length) tweetLimit = tweets.length;

        var printText = "";

        for (var i = 0; i < tweetLimit; i++) {
            printText += tweets[i].created_at + ": " + tweets[i].text + "\n";
        }

        console.log(printText);
        logData("### MOST RECENT TWEETS ###\n" + printText + "\n### END MOST RECENT TWEETS ###\n\n");
     });
}

//for setting test data
function sendTestTweet(msg) {
    client.post('statuses/update', {status: msg},  function(error, tweet, response) {
          if(error) throw error;
          console.log("Tweet Sent");
    });
}

//Spotify functions
function getSpotifyData(songName) {
    if (songName !== "") {
        spotify.search({ type: 'track', query:songName}).then(function(response) {
            if (response.tracks.items.length > 0) {
                for (var i = 0; i < response.tracks.items.length; i++) {
                    var recordObj = response.tracks.items[i];

                    var printText = "Artist: " + recordObj.artists[0].name + "\n";
                    printText += "Title: " + recordObj.name + "\n";
                    printText += "Album: " + recordObj.album.name + "\n";
                    printText += "Preview Link: " + recordObj.preview_url;

                    console.log("############################################################################################################");
                    console.log(printText);
                    console.log("############################################################################################################\n");

                    logData("### SPOTIFY SEARCH ###\n" + printText + "\n### END SPOTIFY SEARCH ###\n\n");
                }
            } else {
                console.log("### A song with the title \""+ songName +"\" could not be found ###");
            }
        
        }).catch(function(err) {
            console.log(err);
        });//end spotify
    } else {
        console.log("### Please specify a song title to search. ###");
    }    
}

function getOMDBData(title) {
    var omdbURL = "http://www.omdbapi.com/?apikey=40e9cece&";
    //modify URL to Mr. Nobody if title is blank
    omdbURL += (title == "")?("i=tt0485947"):("t="+title); 

    request(omdbURL, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            var movieObj = JSON.parse(body);

            if (!movieObj.hasOwnProperty("Error")) {
                var printText = "";
                
                // * Title of the movie.
                printText += "Movie Title: " + movieObj.Title + "\n";
                // * Year the movie came out.
                printText += "Year: " + movieObj.Year + "\n";
                // * IMDB Rating of the movie.
                printText += "IMDB Rating: " + movieObj.Ratings[0].Value + "\n";
                // * Rotten Tomatoes Rating of the movie.
                printText += "Rotten Tomatoes Rating: " + movieObj.Ratings[1].Value + "\n";
                // * Country where the movie was produced.
                printText += "Country: " + movieObj.Country + "\n";
                // * Language of the movie.
                printText += "Language: " + movieObj.Language + "\n";
                // * Plot of the movie.
                printText += "Plot: " + movieObj.Plot + "\n";
                // * Actors in the movie.
                printText += "Actors: " + movieObj.Actors;

                console.log("############################################################################################################");
                console.log(printText);
                console.log("############################################################################################################\n");

                logData("### OMDB SEARCH ###\n" + printText + "\n### END OMDB SEARCH ###\n");
            } else {
                console.log("### No movie could be found with this title. ###");
            }
        }
    });// end request  
}

function readRandomFile() {
    fs.readFile("random.txt", "utf8", function(error, data) {
        if (!error) {
            var dataArr = data.split(",");
            if (dataArr.length > 0) {
                command = dataArr[0].trim();

                if (dataArr.length === 2) {
                    genericParam = dataArr[1].trim();
                } else {
                    genericParam = "";
                }

                main();
            } else {
                console.log("### There are insufficient parameters in the random.txt file. ###");
            }
        } else {
            console.log("### An error has occured in reading the random.txt file. ###")
        }
    });
}

function logData(textToLog) {
    fs.appendFile("log.txt", textToLog, function(err) {
        if (err) {
          console.log(err);
        }
    });
}

init();