/**
 * Created by erosb on 2017.04.26..
 */
"use strict";

const sut = require("../app");
const httpMocks = require("node-mocks-http");

function base64Encode(str) {
  return new Buffer(str).toString("base64");
}

describe("validateClientId", () => {

  it("accepts expected", () => {
    const res = httpMocks.createResponse();
    expect(sut.validateClientId(sut.EXPECTED_CLIENT_ID, res)).toBe(true);
  });

  it("refuses others", ()  => {
    const res = httpMocks.createResponse();
    expect(sut.validateClientId("something else", res)).toBe(false);
    expect(res.statusCode).toBe(400);
  });

});

describe("validateAuthorizationHeader", () => {

  function resp() {
    return httpMocks.createResponse();
  }

  it("is false if doesn't start with 'Basic'", () => {
    expect(sut.validateAuthorizationHeader("asd")).toBe(false);
  });

  it("is false if it cannot be base64-decoded", () => {
    expect(sut.validateAuthorizationHeader("Basic #&@#&@")).toBe(false);
  });

  it("is false without base64-encoded suffix", () => {
    expect(sut.validateAuthorizationHeader("Basic")).toBe(false);
  });

  it("is false if decoded doesnt contain :", () => {
    expect(sut.validateAuthorizationHeader("Basic " + base64Encode(sut.EXPECTED_CLIENT_ID))).toBe(false);
  });

  it("returns false if the 1st segment is not the expected client id", () => {
    const header = "Basic " + base64Encode("asd: " + sut.EXPECTED_CLIENT_SECRET);
    expect(sut.validateAuthorizationHeader(header)).toBe(false)
  });

  it("returns false if the 2nd segment is not the expected client secret", () => {
    const header = "Basic " + base64Encode(sut.EXPECTED_CLIENT_ID + ":asd");
    expect(sut.validateAuthorizationHeader(header)).toBe(false);
  });

});

describe("validateAccessTokenRequest", () => {

    it("accepts expected client_id and client_secret", () => {
      const base64EncodedAuthCode = base64Encode(sut.EXPECTED_CLIENT_ID + ":" + sut.EXPECTED_CLIENT_SECRET);
      const request = httpMocks.createRequest({
        method: "GET",
        url: "/oauth2/v4/token",
        query: {
          client_id : sut.EXPECTED_CLIENT_ID,
          grant_type : "authorization_code"
        },
        headers: {
          "Authorization" : "Basic " + base64EncodedAuthCode
        }
      });
      expect(sut.validateAccessTokenRequest(request, httpMocks.createResponse())).toBe(true);
    });

    it("is false for invalid authorization header", () => {
      const base64EncodedAuthCode = base64Encode(sut.EXPECTED_CLIENT_ID + ":wrOOOONGG!!");
      const request = httpMocks.createRequest({
        method: "GET",
        url: "/oauth2/v4/token",
        query: {
          client_id : sut.EXPECTED_CLIENT_ID,
          grant_type : "authorization_code"
        },
        headers: {
          "Authorization" : "Basic " + base64EncodedAuthCode
        }
      });
      const res = httpMocks.createResponse();
      expect(sut.validateAccessTokenRequest(request, res)).toBe(false);

      expect(res.statusCode).toBe(401);
    });
});
