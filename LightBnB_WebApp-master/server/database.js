const properties = require('./json/properties.json');
const users = require('./json/users.json');

const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {

  return pool
  .query(`SELECT * FROM users WHERE email = $1`, [email])
  .then((result) => {
    console.log(result.rows);
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
    return null;
  });


  // let user;
  // for (const userId in users) {
  //   user = users[userId];
  //   if (user.email.toLowerCase() === email.toLowerCase()) {
  //     break;
  //   } else {
  //     user = null;
  //   }
  // }
  // return Promise.resolve(user);
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {

  return pool
  .query(`SELECT id FROM users WHERE id = $1`, [id])
  .then((result) => {
    console.log(result.rows);
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
    return null;
  });


  // return Promise.resolve(users[id]);
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool
  .query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`, [user.name, user.email, user.password])
  .then((result) => {
    console.log(result.rows[0]);
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
    return null;
  });




  // const userId = Object.keys(users).length + 1;
  // user.id = userId;
  // users[userId] = user;
  // return Promise.resolve(user);
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  // console.log("guest-id:", guest_id);

  return pool
    .query(
      `SELECT reservations.*, properties.*, avg(rating) as average_rating
      FROM reservations
      JOIN properties ON reservations.property_id = properties.id
      JOIN property_reviews ON properties.id = property_reviews.property_id
      WHERE reservations.guest_id = $1
      GROUP BY properties.id, reservations.id
      ORDER BY reservations.start_date
      LIMIT $2;`
      , [guest_id, limit])
    .then((result) => {
      console.log("result", result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });

  // return getAllProperties(null, 2);
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {

  const queryParams = [];
  let queryString = `
  SELECT properties.*, Avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON property_id = properties.id 
  `;

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += `WHERE owner_id = $${queryParams.length} `;
  }

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }


  if (options.minimum_price_per_night) {
    if (options.city) {
      queryParams.push(`${options.minimum_price_per_night * 100}`)
      queryString += `AND properties.cost_per_night >= $${queryParams.length} `
    } else {
      queryParams.push(`${options.minimum_price_per_night * 100}`)
      queryString += `WHERE properties.cost_per_night >= $${queryParams.length} `
    }

  }

  if (options.maximum_price_per_night) {
    if (options.city || options.minimum_price_per_night) {
      queryParams.push(`${options.maximum_price_per_night * 100}`)
      queryString += `AND properties.cost_per_night <= $${queryParams.length} `
    } else {
      queryParams.push(`${options.maximum_price_per_night * 100}`)
      queryString += `WHERE properties.cost_per_night <= $${queryParams.length} `
    }

  }

  queryString +=
  `GROUP BY properties.id `

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`)
    queryString +=  `HAVING Avg(property_reviews.rating) >= $${queryParams.length} `
  }
  queryParams.push(limit)

  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};`
  
  console.log(queryString, queryParams)

  return pool
  .query(queryString, queryParams)
  .then((result) => {
    console.log("result", result.rows);
    return result.rows;
  })
  .catch((err) => {
    console.log(err.message);
  });

}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {


  const queryParams = []

  queryParams.push(property.owner_id)
  queryParams.push(property.title)
  queryParams.push(property.description)
  queryParams.push(property.thumbnail_photo_url)
  queryParams.push(property.cover_photo_url)
  queryParams.push(property.cost_per_night * 100)
  queryParams.push(property.street)
  queryParams.push(property.city)
  queryParams.push(property.province)
  queryParams.push(property.post_code)
  queryParams.push(property.country)
  queryParams.push(property.parking_spaces)
  queryParams.push(property.number_of_bathrooms)
  queryParams.push(property.number_of_bedrooms)

  let queryString = 
  `INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`
  


  return pool
  .query(queryString, queryParams)
  .then((result) => {
    console.log(result.rows[0]);
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
    return null;
  });
  
  // const propertyId = Object.keys(properties).length + 1;
  // property.id = propertyId;
  // properties[propertyId] = property;
  // return Promise.resolve(property);
}
exports.addProperty = addProperty;
