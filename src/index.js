import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App/App.js';
import { createStore, combineReducers, applyMiddleware } from 'redux';
// Provider allows us to use redux within our react app
import { Provider } from 'react-redux';
import logger from 'redux-logger';
// Import saga middleware
import createSagaMiddleware from 'redux-saga';
import { call, put, takeEvery } from 'redux-saga/effects';
import axios from 'axios';  

// Create the rootSaga generator function
function* rootSaga() { // listener functions waiting for calls
    yield takeEvery('FETCH_MOVIES', fetchAllMovies);
    yield takeEvery('FETCH_MOVIES_AND_GENRES', fetchMoviesAndGenres);
    yield takeEvery('FETCH_GENRES', fetchGenres);
    yield takeEvery('ADD_MOVIE', addMovie);
    yield takeEvery('DELETE_MOVIES_GENRES', deleteMoviesAndGenres);
    yield takeEvery('DELETE_MOVIE', deleteMovie);
    yield takeEvery('SAVE_EDITED_MOVIE', saveEditedMovie);
};

function* fetchAllMovies () {
    // get all movies from the DB
    try {
        const movies = yield axios.get ('/api/movie');
        // console.log('getting all movies:', movies.data); // test function
        yield put ({ type: 'SET_MOVIES', payload: movies.data });
    }
    catch (error) {
        console.log ('Error in fetchAllMovies:', error);
    };
};

function* saveEditedMovie (movie) {
    const editedMovie = movie.payload[0] // set a variable equal to the data we want
    console.log('Trying to edit movie:', editedMovie); // test function
    try {
        yield call (axios.post, '/api/movie/UPDATE_MOVIE', editedMovie); // post our edits to axios
        yield put ({ type:'FETCH_MOVIES' });
    }
    catch (error) {
        console.log ('Error in saveEditedMovie:', error);
    };
};

function* deleteMoviesAndGenres (movie) {
    // console.log('trying to delete movie with ID:', movie); // test function
    try { // axios call cause delete is dumb
        const response = yield axios ({
        method: 'DELETE',
        url: '/api/movie/DELETE_MOVIE_AND_GENRE',
        data: movie
        });
        // console.log(response); // test function
        // yield call (axios.delete, '/api/movie/delete', movieToDelete); // test function
        // yield put ({type: 'DELETE_MOVIE', payload: movieToDelete}); // test function
       yield put ({ type: "DELETE_MOVIE", payload: movie}); // head over to delete_movie after deleting it from our database
    }
    catch (error)  {
        console.log ('Error in deleteMoviesAndGenres:', error);
    };
};

function* deleteMovie (movie) {
    // console.log('trying to delete movie with ID:', movie); // test function
    try { // axios call cause delete is dumb
        const response = yield axios ({
        method: 'DELETE',
        url: '/api/movie/DELETE_MOVIE',
        data: movie
        });
        // console.log(response); // test function
        // yield call (axios.delete, '/api/movie/delete', movieToDelete); // test function 
        // yield put ({type: 'DELETE_MOVIE', payload: movieToDelete}); // test function
       yield put ({ type: "FETCH_MOVIES" });
    }
    catch (error) {
        console.log ('Error in deleteMovie:', error);
    };
};

function* addMovie (movie) {
    try {
        const movieToAdd = movie.payload[0];
        // console.log(movieToAdd); // test function
        // const add = yield axios.post('/api/movie'); // test function
        yield call (axios.post, '/api/movie', movieToAdd);
        yield put ({ type:'FETCH_MOVIES' });
    }
    catch (error) {
        console.log ('Error in addMovie:', error);
    };
};

function* fetchGenres (IDs) {
    try {
        const genre = yield axios.get ('/api/genre/GET_GENRES'); // calls genres from server
        const genreIDArray = [];
        let sendBack = [];
        const idArray = IDs.payload;
        for (let x = 0; x < genre.data.length; x++) {genreIDArray.push(genre.data[x].id)}; // loop through genres and create an array that holds just their numeric IDs
        //console.log('genreIDArray array is:', genreIDArray); // test function
        // console.log('idArray is:', idArray); // test function
        for (let i = 0; i < idArray.length; i++) {
            sendBack.push(genre.data[idArray[i]-1].name); // pushes matching 
        };
        // console.log(sendBack); // test function
        yield put ({ type: "SET_GENRES", payload: sendBack });
    }
    catch (error) {
        console.log ('Error in fetchGenres:', error);
    };
};

function* fetchMoviesAndGenres(movie) {
    try {
        const movies = yield axios.get (`/api/genre`); // calls movies from server
        // console.log('movie:', movie.payload); // test function
        let genreIDs = [];
        for (let x = 0; x < movies.data.length; x++) {
            //console.log(movies.data[x].movie_id, movies.data[x].genre_id); // test function
            if (movies.data[x].movie_id == movie.payload.id) {
                
                //console.log("data for this movie is:", movies.data[x].genre_id);
                genreIDs.push (movies.data[x].genre_id);
            };
        };
        // console.log(`Genre IDs of ${movie.payload.title} are: ${genreIDs}`); // test function
        yield put ({ type: 'FETCH_GENRES', payload: genreIDs });
    }
    catch (error) {
        console.log ('Error in fetchMoviesAndGenres:', error);
    };
};

// Create sagaMiddleware
const sagaMiddleware = createSagaMiddleware();

// Used to store movies returned from the server
const movies = (state = [], action) => {
    switch (action.type) {
        case 'SET_MOVIES':
            return action.payload;
        default:
            return state;
    };
};

// Used to store the movie genres
const genres = (state = [], action) => {
    switch (action.type) {
        case 'SET_GENRES':
            // console.log('setting genre', action.payload) // test function
            return action.payload;
        default:
            return state;
    };
};

// Create one store that all components can use
const storeInstance = createStore(
    combineReducers({
        movies,
        genres,
    }),
    // Add sagaMiddleware to our store
    applyMiddleware(sagaMiddleware, logger),
);

// Pass rootSaga into our sagaMiddleware
sagaMiddleware.run(rootSaga);

ReactDOM.render(
    <React.StrictMode>
        <Provider store={storeInstance}>
        <App />
        </Provider>
    </React.StrictMode>,
    document.getElementById('root')
);