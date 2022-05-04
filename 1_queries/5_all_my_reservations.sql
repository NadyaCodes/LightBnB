SELECT reservations.id, properties.title, start_date, cost_per_night, avg(property_reviews.rating) as average_rating
FROM reservations
JOIN properties ON properties.id = property_id
JOIN property_reviews ON property_reviews.property_id = properties.id
GROUP BY reservations.id, properties.title, properties.cost_per_night
HAVING reservations.guest_id = 1
ORDER BY reservations.start_date
LIMIT 10;



-- SELECT reservations.id, properties.title, properties.cost_per_night, reservations.start_date, avg(rating) as average_rating
-- FROM reservations
-- JOIN properties ON reservations.property_id = properties.id
-- JOIN property_reviews ON properties.id = property_reviews.property_id
-- WHERE reservations.guest_id = 1
-- GROUP BY properties.id, reservations.id
-- ORDER BY reservations.start_date
