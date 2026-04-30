import test from 'node:test'
import assert from 'node:assert/strict'
import { formatDisplayUrl } from './formatDisplayUrl.js'

test('formats https url into readable host + path', () => {
  assert.equal(
    formatDisplayUrl('https://www.example.com/docs/getting-started?lang=zh#intro'),
    'example.com/docs/getting-started'
  )
})

test('returns route path for internal links', () => {
  assert.equal(formatDisplayUrl('/common-soft'), '/common-soft')
})

test('falls back to original value for invalid url-like text', () => {
  assert.equal(formatDisplayUrl('not a url'), 'not a url')
})
