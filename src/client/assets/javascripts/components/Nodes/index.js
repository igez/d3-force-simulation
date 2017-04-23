import * as d3 from 'd3'
import _ from 'lodash'

class Nodes {
  constructor(container, onUpdateCb) {
    this.container = container

    this.color = d3.scaleOrdinal(d3.schemeCategory20);

    this.selectedNodes = []

    this.onUpdateCb = onUpdateCb
  }

  set(nodes, links) {
    this.nodes = nodes
    this.links = links
  }

  addNode(node) {
    console.log(this.nodes, node)
    this.nodes.push(node)

    // if (this.selectedNode != null) {
    //   this.links.push({
    //     source: this.selectedNode.id,
    //     target: node.id,
    //     value: 50
    //   })
    // }

    this.restart();
  }

  reset() {
    console.log(this.node.exit().remove())
    // this.nodes = []
    // this.links = []

    // this.restart();
  }

  linkNode(source, target) {
    this.links.push({
      source: source.id,
      target: target.id
    });

    this.removeSelection()

    this.restart()
  }

  draw() {
    this.forceCollision = d3.forceCollide().radius((d) => d.radius * 1.05).strength(1)
    this.simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(function(d) {
        return Math.floor((d.source.radius + d.target.radius) + 40);
      }))
      .force("charge", d3.forceManyBody().strength(-1))
      // .force("center", d3.forceCenter(this.container.attr('width') / 2, this.container.attr('height') / 2))
      // .force("x", d3.forceX(this.container.attr('width') / 2).strength(0.01))
      // .force("y", d3.forceY(this.container.attr('height') / 2).strength(0.01))
      .force("collide", this.forceCollision)

    this.link = this.container.append("g")
      .attr("class", "links")
      .selectAll("line");

    this.node = this.container.append("g")
      .attr("class", "nodes")
      .selectAll("#node")

    this.text = this.container.append('g')
      .attr('class', 'text')
      .selectAll('text')

    this.simulation
      .nodes(this.nodes)
      .on("tick", this.onTick.bind(this));

    this.simulation.force("link")
      .links(this.links)

    this.start()
  }

  onDragStart(d) {
    if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  onDrag(d) {
    const selected = _.findIndex(this.selectedNodes, (node) => {
      return node.id == d.id
    })
    if (this.selectedNodes.length && selected != -1) {
      const pointer = d3.mouse(this.container.node())
      const radius = this.getRadius(d.x, d.y, pointer[0], pointer[1])

      d.radius = radius
    } else {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }
  }

  onDragEnd(d) {
    if (!d3.event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;

    this.restart();
  }

  onMouseOver(d, container) {
    // d3.select(`#node-${d.id}`).attr('class', 'hover')
  }

  onDragResize(dd, d) {
    const pointer = d3.mouse(this.container.node())

    console.log(pointer, dd, d)
  }

  onMouseMove(container) {
    const pointer = d3.mouse(container.node())
  }

  onMouseLeave(d, container) {
    // d3.select(`#node-${d.id}`).attr('class', null)
  }

  removeSelection() {
    d3.selectAll('.node').attr('stroke', '#fff')
    this.selectedNodes = []
  }

  onMouseClick(d) {
    if (this.selectedNodes.length == 2) {
      this.selectedNodes.splice(0, 1)
    }

    this.selectedNodes.push(d)

    d3.selectAll('.node').attr('stroke', '#fff')

    this.selectedNodes.map((node) => {
      d3.select(`#node-${node.id}`).attr('stroke', '#333').attr('stroke-width', 4)
    })

    this.onUpdateCb(this.selectedNodes)
  }

  removeNode(node) {
    const nodeIndex = _.findIndex(this.nodes, (n) => {
      return n.id == node.id
    });

    const linkIndex = _.findIndex(this.links, (n) => {
      return n.source.id == node.id || n.target.id == node.id
    });

    if (linkIndex != -1) {
      this.links.splice(linkIndex, 1)
    }

    if (nodeIndex != -1) {
      this.nodes.splice(nodeIndex, 1)
    }

    this.restart()
  }

  restart() {
    console.info('Re-applying simulation force to all nodes...')
    this.start();
  }

  start() {
    this.node = this.node.data(this.nodes)
    this.node.exit().remove()
    this.node = this.node
      .enter().append("circle")
      .attr("r", (d) => d.radius)
      .attr('id', (d) => `node-${d.id}`)
      .attr('class', (d) => 'node')
      .attr("fill", (d) => this.color(Math.random()))
      .attr("stroke", (d) => '#fff')
      .attr('stroke-width', (d) => 4)
      .attr('cx', (d) => d.cx = 1500)
      .call(d3.drag()
        .on("start", this.onDragStart.bind(this))
        .on("drag", this.onDrag.bind(this))
        .on("end", this.onDragEnd.bind(this))
      )
      .on("mouseover", (d) => this.onMouseOver(d))
      .on("mouseleave", (d) => this.onMouseLeave(d, this.container))
      .on('mousemove', (e) => this.onMouseMove(this.container))
      .on('dblclick', this.onMouseClick.bind(this))
      .merge(this.node);

    this.text = this.text.data(this.nodes)
    this.text.exit().remove()
    this.text = this.text
      .enter().append('text')
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .text((d) => d.id)
      .attr('text-anchor', 'middle')
      .merge(this.text)

    this.link = this.link.data(this.links)
    this.link.exit().remove();

    this.link = this.link.enter().append("line")
      .attr("stroke-width", function(d) { return 4; }).merge(this.link);

    this.simulation.nodes(this.nodes);
    this.simulation.force("link").links(this.links);
    this.simulation.alpha(1).restart();
  }

  onTick() {
    this.link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

    this.text
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)

    this.node
      .attr("cx", function(d) {
        return d.x
      })
      .attr("cy", function(d) {
        return d.y
      })
      .attr('r', (d) => d.radius)
  }

  getRadius(x1, y1, x2, y2) {
    return Math.sqrt(( Math.pow(x2 - x1, 2) + (Math.pow(y2 - y1, 2)) ));
  }
}

export default Nodes
