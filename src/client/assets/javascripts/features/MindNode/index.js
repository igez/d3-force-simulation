import React, { Component } from 'react'
import * as d3 from 'd3'
import PropTypes from 'prop-types';

import Nodes from '../../components/Nodes'

export default class MindNode extends Component {
  constructor() {
    super()

    this.state = {
      nodes: [],
      links: [],
      current_node: null
    }

    this.isDown = false
    this.isDrag = false

    this.new_circle = false
    this.new_point = false

    this.nodes = []
    this.links = []

    this.color = d3.scaleOrdinal(d3.schemeCategory20);
  }

  componentWillMount() {

  }

  componentDidMount() {
    this.SVGContainer = d3
      .select('#mindnode-container')
      .append('svg')
      .attr('width', window.innerWidth)
      .attr('height', window.innerHeight)
      .on('mousedown', this.onMouseDown.bind(this))
      .on('mousemove', this.onMouseMove.bind(this))
      .on('mouseup', this.onMouseUp.bind(this))

    this.$node = new Nodes(this.SVGContainer, this.onUpdateSelectedNode.bind(this))

    this.$node.set(this.state.nodes, this.state.links)
    this.$node.draw()

    // this.linkRef = firebase.database().ref('links');
    // this.linkRef.on('child_added', (d) => {
    //   this.links.push(d.val())

    //   this.setState({
    //     links: this.links
    //   })
    // })


    // this.linkRef.on('value', (d) => {
    //   console.log(d)
    // })
  }

  onMouseDown(e) {
    this.pointer1 = d3.mouse(this.SVGContainer.node())

    if (!this.isDown && !this.new_circle) {
      this.new_circle = this.SVGContainer
        .append('circle')
        .attr('id', 'drawer')
        .attr('cx', this.pointer1[0])
        .attr('cy', this.pointer1[1])
        .attr('r', 0)
        .attr('fill', this.color(Math.random()))

      this.new_point = this.SVGContainer
        .append('circle')
        .attr('id', 'point')
        .attr('r', 10)
        .attr('fill', '#fff')
        .attr('stroke', '#ddd')
        .attr('stroke-width', 2)
    }

    this.isDown = true
  }

  onMouseUp(e) {
    this.isDown = false
    this.new_circle = false
    this.new_point = false

    d3.select('circle#point').remove()
    d3.select('circle#drawer').remove()

    const rad = this.getRadius(this.pointer1[0], this.pointer1[1], this.pointer2[0], this.pointer2[1])

    if (rad < 10) return

    const node = {
      id: `node-${Math.floor(Math.random() * 100000000)}`,
      radius: this.getRadius(this.pointer1[0], this.pointer1[1], this.pointer2[0], this.pointer2[1]),
      color: '#ddd',
      x: this.pointer1[0],
      y: this.pointer1[1]
    }

    this.$node.addNode(node)
  }

  onMouseMove(e) {
    this.pointer2 = d3.mouse(this.SVGContainer.node())
    if (this.isDown) {
      const radius = this.getRadius(this.pointer1[0], this.pointer1[1], this.pointer2[0], this.pointer2[1])

      this.new_circle.attr('r', radius)

      this.new_point
        .attr('cx', this.pointer2[0])
        .attr('cy', this.pointer2[1])
        .attr('r', 10)
    }
  }

  getRadius(x1, y1, x2, y2) {
    return Math.sqrt(( Math.pow(x2 - x1, 2) + (Math.pow(y2 - y1, 2)) ));
  }

  clearNode() {
    this.$node.reset()
  }

  addNode() {
    // if (this.state.current_node == null) {
    //   alert('Please select node first!')

    //   return
    // }

    var data = {id: `node-${ Math.floor(Math.random() * 100000000) }`, color: 'cyan', radius: Math.random() * 100}

    this.$node.addNode(data)
  }

  removeNode() {
    if (this.state.current_node == null) {
      alert('Please select node first!')

      return
    }

    var confirm = window.confirm(`Remove node ${this.state.current_node.id} ?`)

    if (confirm) {
      this.$node.removeNode(this.state.current_node)
    }
  }

  onUpdateSelectedNode(node) {
    this.setState({
      current_node: node
    })
  }

  linkNodes() {
    if (this.state.current_node == null || this.state.current_node.length != 2) {
      alert('You need to at least select 2 nodes')

      return
    }

    this.$node.linkNode(this.state.current_node[0], this.state.current_node[1])
  }

  render() {
    return (
      <div id="mindnode-container" ref="container">
        <button onClick={ this.linkNodes.bind(this) }>Link Nodes</button>
      </div>
    )
  }
}

