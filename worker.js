addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request).catch(
    (err) => new Response("Report this to Owner... ==> " + err.stack, { status: 500 })
  ));
});

const apiKey = '72f87a4';  // Your apikey from https://www.themoviedb.org/
const bottoken = '68896:ydZ4L0'  // Telegram bot token from @BotFather


async function handleRequest(request) {
  try {
    const data = await request.json();  
    
    if (data.message && data.message.text && request.method === 'POST') {
      const chatId = data.message.chat.id; 
      const messageId = data.message.message_id; 
      const messageText = data.message.text;
      
      if (messageText.startsWith('/start')) {
        const inlineButtons = [
          [{ text: 'GitHub Repo', url: 'https://github.com/ShlokDhakrey' }],
          [{ text: 'Owner', url: 'https://t.me/dhakreyy' }]
         ];
      
        await sendMessage(chatId, messageId, "Welcome to TMDB Search Bot \n\nMade Using TMDB API \n\n - Hosted on Cloudflare", data.message.from.username, inlineButtons);
      }
       else if (messageText.startsWith('/tmdb')) {
        const keyword = messageText.split(' ').slice(1).join(' ');
        const tmdbResults = await searchMoviesByKeyword(keyword);
        
        if (tmdbResults && tmdbResults.length > 0) {
          const movies = tmdbResults.map(movie => ({
            title: movie.title,
            release_date: movie.release_date,
            overview:movie.overview, 
            poster_path: movie.poster_path,
            vote_average:movie.vote_average
          }));
          const message = movies.map(movie => `\n\nQuery : ${keyword}\n\nHere are your search results : \n\nMovie Name : ${movie.title} \n\nRelease Date : ${movie.release_date}\n\nDescription : ${movie.overview}\n\nhttps://image.tmdb.org/t/p/w500${movie.poster_path}\n\nRating : ${movie.vote_average.toFixed(1)}/10`).join('\n\n');
          await sendMessage(chatId, messageId, message, data.message.from.username);
        } else {
          await sendMessage(chatId, messageId, "\n\nNo movies found for the given keyword.", data.message.from.username);
        }
      }
    }
    return new Response('OK', { status: 200 });  
  } catch (err) {
    console.error(err);
    return new Response("An error occurred.", { status: 500 });  
  }
}
 
async function sendMessage(chatID, replyID, messageText, username, inlineButtons = null) {
  try {
    const requestBody = {
      chat_id: chatID,
      reply_to_message_id: replyID,
      text: `Hello @${username}, ${messageText}`,  
      disable_web_page_preview: false
    };

    if (inlineButtons) {
      requestBody.reply_markup = JSON.stringify({
        inline_keyboard: inlineButtons
      });
    }

    await fetch('https://api.telegram.org/bot'+bottoken+'/sendMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
  } catch (err) {
    console.error("Error sending message:", err);
  }
}


async function searchMoviesByKeyword(keyword) {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(keyword)}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      return data.results;  
    } else {
      throw new Error(data.status_message || 'Failed to fetch movies');
    }
  } catch (error) {
    console.error('Error searching for movies:', error);
    throw error;
  }
}
