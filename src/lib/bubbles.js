'use strict'

import * as d3 from 'd3'
import _ from 'lodash'

export default class BubblesChart {
  constructor (options) {
    this.container = document.querySelector(options.selector)

    this.transition = options.transition
    this.maxRelations = options.maxRelations

    const svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')

    this.chartArea = svg
      .append('g')
  }

  getHeight () {
    return this.container.clientHeight
  }

  getWidth () {
    return this.container.clientWidth
  }

  formatData (raw) {
    return _.transform(raw, (res, values, topic) => {
      const relations = _.map(_.last(values).relations, (r, name) => ({ name, r, topic }))
      const topRelations = _.orderBy(relations, 'r', 'desc').slice(0, this.maxRelations)
      res.push(...topRelations)
      return res
    }, [])
  }

  init (data) {
    this._topics = Object.keys(data)
    this._lastData = this.formatData(data)

    this.updateBubbles({ first: true })
    d3.select(this.container).classed('loading', false)

    window.addEventListener('resize', () => this.resize())
    this._initialized = true
  }

  resize () {
    this.updateBubbles()
  }

  update (data) {
    if (!this._initialized) return

    this._lastData = this.formatData(data)

    this.updateBubbles({ transition: this.transition })
  }

  updateBubbles (options = {}) {
    const data = d3.packSiblings(this._lastData)
    const enclose = d3.packEnclose(this._lastData)

    const height = this.getHeight()
    const width = this.getWidth()
    const center = { x: width / 2, y: height / 2 }
    const translate = `${center.x},${center.y}`
    const scale = Math.min(height, width) / (enclose.r * 2)

    const circles = this.chartArea
      .attr('transform', `translate(${translate}) scale(${scale})`)
      .selectAll('.circle-node')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'circle-node')

    circles
      .append('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', (d) => d.r)
      .attr('class', (d) => `chart-color-${this._topics.indexOf(d.topic) + 1}`)

    circles
      .append('text')
      .text((d) => `${d.name} ${d.r}`)
  }
}