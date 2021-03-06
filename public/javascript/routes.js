// Load required libraries from node_modules
const express = require('express')
const withQuery = require('with-query').default
const fetch = require('node-fetch')
const pool = require('./create_pool')

// SQL Queries
const queryForBooksFromChar = 'select * from book2018 where title like ?'
const queryForBookById = 'select * from book2018 where book_id = ?'

module.exports = () => {
  console.log('In the router!')
  const router = express.Router()
  
  router.get('/category/:firstChar', async (req, res) => {
    const firstChar = req.params.firstChar
    const conn = await pool.getConnection()
    console.info('Pool connected')
    try {
      console.info(`Getting books starting with ${firstChar}`)
      const result = await conn.query(queryForBooksFromChar, [`${firstChar}%`])
      const booksArr = result[0]
      const hasBooks = booksArr.length > 0
      console.info(booksArr)
      res.status(200)
      res.type('text/html')
      res.render('category', { booksArr, firstChar, hasBooks })
    } catch(e) {
      res.status(500)
      res.type('text/html')
      res.send('<h2>Error</h2>' + e)
    } finally {
      console.info('Releasing connection')
      conn.release()
    }
  })
  
  router.get('/book/:book_id', async (req, res) => {
    const bookId = req.params.book_id
    const conn = await pool.getConnection()
    console.info('Pool connected')
    try {
      console.info(`Getting book ID ${bookId}`)
      const result = await conn.query(queryForBookById, [`${bookId}`])
      const book = result[0]
      console.log(book)
      let genres = book[0].genres.replace(/\|/g, ', ')
      console.log(genres)
      let authors = book[0].authors.replace(/\|/g, ', ')
      book[0].genres = genres
      book[0].authors = authors
      const bookExist = book.length == 1
      // console.log(result)
      
      res.format({
        'text/html': () => {
          res.status(200)
          res.render('book', { book, bookExist })
        },
        'application/json': () => {
          res.status(200)
          res.json({
            // bookId: ,
            // title: ,
            // authors: ,
            // summary: ,
            // pages: ,
            // rating: ,
            // ratingCount: ,
            // genre: 
          })
        }
      })


    } catch(e) {
      res.status(500)
      res.type('text/html')
      res.send('<h2>Error</h2>' + e)
    } finally {
      console.info('Releasing connection')
      conn.release()
    }
  })

  router.get('/review/:book_id', async (req, res) => {
    const bookId = req.query.bookId
    const title = req.query.title
    const apiKey = process.env.API_KEY
    const url = withQuery(process.env.ENDPOINT,{
      'api-key': apiKey,
      title: title
    })
    const rawResults = await fetch(url)
    console.info('Receiving API response!')
    const reviewResults = await rawResults.json()
    console.info(reviewResults)
    const reviews = await reviewResults.results
    console.log(reviewResults.num_results)
    const hasReviews = reviewResults.num_results >= 1
    res.status(200)
    res.type('text/html')
    res.render('review', { reviews, hasReviews, title }) 
  })
  
  router.get(['/', '/index.html'], (req, res) => {
    const letters = 'abcdefghijklmnopqrstuvwxyz'.toUpperCase().split('')
    const numbers = '0123456789'.split('')
    res.status(200)
    res.type('text/html')
    res.render('index', { letters, numbers })
    console.log('Loaded root page')
  })
  
  return router
}