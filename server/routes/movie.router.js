const express = require('express');
const router = express.Router();
const pool = require('../modules/pool')

router.get('/', (req, res) => {

  const query = `SELECT * FROM movies ORDER BY "title" ASC`;
  pool.query(query)
    .then( result => {
      res.send(result.rows);
    })
    .catch(err => {
      console.log('ERROR: Get all movies', err);
      res.sendStatus(500)
    })

});

router.delete('/DELETEMOVIEANDGENRE', (req, res) => {
  const qText = `DELETE FROM movies_genres WHERE movie_id=$1;`;
  //console.log(req.body.payload); // test function
  pool.query(qText, [req.body.payload])
  .then( 
    result => {
    res.send(result.rows);
  }
  )
  .catch(err => {
    console.log(err);
  })
})

router.delete('/DELETEMOVIE', (req, res) => {
  const qText = `DELETE FROM movies WHERE id=$1;`;
  console.log('trying to delete from movies:', req.body.payload.payload);
  pool.query(qText, [req.body.payload.payload])
  .then( 
    result => {
    res.send(result.rows);
  }
  )
  .catch(err => {
    console.log(err);
  })
})

router.post('/', (req, res) => {
  console.log(req.body);
  // RETURNING "id" will give us back the id of the created movie
  const insertMovieQuery = `
  INSERT INTO "movies" ("title", "poster", "description")
  VALUES ($1, $2, $3)
  RETURNING "id";`

  // FIRST QUERY MAKES MOVIE
  pool.query(insertMovieQuery, [req.body.title, req.body.poster, req.body.description])
  .then(result => {
    console.log('New Movie Id:', result.rows[0].id); //ID IS HERE!
    
    const createdMovieId = result.rows[0].id

    // Now handle the genre reference
    const insertMovieGenreQuery = `
      INSERT INTO "movies_genres" ("movie_id", "genre_id")
      VALUES  ($1, $2);
      `
      // SECOND QUERY ADDS GENRE FOR THAT NEW MOVIE
      pool.query(insertMovieGenreQuery, [createdMovieId, req.body.genre_id]).then(result => {
        //Now that both are done, send back success!
        res.sendStatus(201);
      }).catch(err => {
        // catch for second query
        console.log(err);
        res.sendStatus(500)
      })

// Catch for first query
  }).catch(err => {
    console.log(err);
    res.sendStatus(500)
  })
})

module.exports = router;