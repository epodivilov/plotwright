import http from "http";

export function curl(options, method, path, body) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: method,
      path: path,
      port: options.port,
      hostname: options.host || "localhost",
      headers: {
        "Content-Type": "application/json",
        Connection: "close",
      },
    };

    if (options.apikey) {
      requestOptions.headers["x-api-key"] = options.apikey;
    }

    const request = http.request(requestOptions, (response) => {
      const chunks: any[] = [];

      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        chunks.push(chunk);
      });
      response.on("end", () => {
        if (response.statusCode === 200) {
          resolve({ ...response, body: JSON.parse(chunks.join("")) });
        } else {
          reject(new Error(`${response.statusCode}\n${chunks.join("")}`));
        }
      });
    });

    request.on("error", reject);

    if (body) {
      request.write(JSON.stringify(body));
    }
    request.end();
  });
}


type Stub = {
  imposter: number;
  predicates?: Array<{
    contains?: {
      path?: string;
      headers?: Record<string, string>;
    };
  }>;
  responses?: Array<{
    is: {
      statusCode: number;
      body: Record<string, any>;
    };
    behaviors: Array<{
      wait?: number;
    }>;
  }>;
};
export function injectPredicate(stub: Stub, predicate: Record<string, any>) {
  const { predicates = [], ...rest } = stub;

  return {
    ...rest,
    predicates: [
      {
        and: [...predicates, predicate],
      },
    ],
  };
}
