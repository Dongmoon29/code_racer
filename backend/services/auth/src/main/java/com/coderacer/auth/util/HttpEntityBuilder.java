package com.coderacer.auth.util;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.util.Assert;

public final class HttpEntityBuilder {
    private final HttpHeaders headers;
    private Object body;

    private HttpEntityBuilder() {
        this.headers = new HttpHeaders();
    }

    public static HttpEntityBuilder create() {
        return new HttpEntityBuilder();
    }

    public HttpEntityBuilder withFormUrlEncodedContentType() {
        Assert.notNull(headers, "Headers must not be null");
        headers.set(HttpHeaders.CONTENT_TYPE, "application/x-www-form-urlencoded");
        return this;
    }

    public HttpEntityBuilder withJsonAcceptHeader() {
        Assert.notNull(headers, "Headers must not be null");
        headers.set(HttpHeaders.ACCEPT, "application/json");
        return this;
    }

    public HttpEntityBuilder withBearerAuth(String token) {
        Assert.notNull(headers, "Headers must not be null");
        Assert.hasText(token, "Token must not be empty");
        headers.setBearerAuth(token);
        return this;
    }

    public <T> HttpEntityBuilder withBody(T body) {
        this.body = body;
        return this;
    }

    @SuppressWarnings("unchecked")
    public <T> HttpEntity<T> build() {
        Assert.notNull(headers, "Headers must not be null");
        return new HttpEntity<>((T) body, headers);
    }
}
