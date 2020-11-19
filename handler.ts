'use strict';

const hello = async event => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Hello world! My function executed successfully!',
        input: event,
      },
      null,
      2
    ),
  };
};

export { hello };
