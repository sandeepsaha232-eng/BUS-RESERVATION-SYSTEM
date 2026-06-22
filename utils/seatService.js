async function getScheduleCapacity(connection, scheduleId) {
  const [schedules] = await connection.query(`
    SELECT s.ScheduleID, b.Capacity
    FROM Schedules s
    JOIN Buses b ON s.BusID = b.BusID
    WHERE s.ScheduleID = ?
  `, [scheduleId]);

  return schedules[0] || null;
}

async function insertSeatBatch(connection, rows) {
  if (rows.length === 0) return;

  const placeholders = rows.map(() => '(?, ?, ?)').join(', ');
  const params = rows.flatMap((row) => [row.scheduleId, row.seatNumber, 0]);

  await connection.query(
    `INSERT INTO Seats (ScheduleID, SeatNumber, IsBooked) VALUES ${placeholders}`,
    params
  );
}

async function ensureSeatRows(connection, scheduleId) {
  const schedule = await getScheduleCapacity(connection, scheduleId);
  if (!schedule) return [];

  const capacity = Number(schedule.Capacity);
  const [existingSeats] = await connection.query(
    'SELECT SeatNumber FROM Seats WHERE ScheduleID = ?',
    [scheduleId]
  );

  const existingSeatNumbers = new Set(existingSeats.map((seat) => Number(seat.SeatNumber)));
  const missingSeats = [];

  for (let seatNumber = 1; seatNumber <= capacity; seatNumber += 1) {
    if (!existingSeatNumbers.has(seatNumber)) {
      missingSeats.push({ scheduleId, seatNumber });
    }
  }

  await insertSeatBatch(connection, missingSeats);

  const [seats] = await connection.query(
    'SELECT SeatNumber, IsBooked FROM Seats WHERE ScheduleID = ? ORDER BY SeatNumber',
    [scheduleId]
  );

  return seats || [];
}

async function syncAvailableSeats(connection, scheduleId) {
  await connection.query(`
    UPDATE Schedules
    SET AvailableSeats = (
      SELECT COUNT(*)
      FROM Seats
      WHERE ScheduleID = ? AND IsBooked = 0
    )
    WHERE ScheduleID = ?
  `, [scheduleId, scheduleId]);
}

module.exports = {
  ensureSeatRows,
  syncAvailableSeats
};
