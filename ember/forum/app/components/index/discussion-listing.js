import Ember from 'ember';

import HasItemLists from 'flarum/mixins/has-item-lists';
import FadeIn from 'flarum/mixins/fade-in';
import humanTime from 'flarum/utils/human-time';

/**
  Component for a discussion listing on the discussions index. It has `info`
  and `controls` item lists for a bit of flexibility.
 */
export default Ember.Component.extend(FadeIn, HasItemLists, {
  layoutName: 'components/index/discussion-listing',
  attributeBindings: ['discussionId:data-id'],
  classNames: ['discussion-summary'],
  classNameBindings: [
    'discussion.isUnread:unread',
    'active'
  ],
  itemLists: ['info', 'controls'],

  terminalPostType: 'last',
  countType: 'unread',

  discussionId: Ember.computed.alias('discussion.id'),

  active: Ember.computed('childViews.@each.active', function() {
    return this.get('childViews').anyBy('active');
  }),

  displayUnread: Ember.computed('countType', 'discussion.isUnread', function() {
    return this.get('countType') === 'unread' && this.get('discussion.isUnread');
  }),

  countTitle: Ember.computed('discussion.isUnread', function() {
    return this.get('discussion.isUnread') ? 'Mark as Read' : '';
  }),

  displayLastPost: Ember.computed('terminalPostType', 'discussion.repliesCount', function() {
    return this.get('terminalPostType') === 'last' && this.get('discussion.repliesCount');
  }),

  jumpTo: Ember.computed('discussion.lastPostNumber', 'discussion.readNumber', function() {
    return Math.min(this.get('discussion.lastPostNumber'), (this.get('discussion.readNumber') || 0) + 1);
  }),

  authorInfo: Ember.computed('discussion.startUser.username', 'discussion.startTime', function() {
    return (this.get('discussion.startUser.username') || '[deleted]')+' started '+humanTime(this.get('discussion.startTime'));
  }),

  relevantPosts: Ember.computed('discussion.relevantPosts', 'discussion.startPost', 'discussion.lastPost', function() {
    if (this.get('controller.show') !== 'posts') { return []; }
    if (this.get('controller.searchQuery')) {
      return this.get('discussion.relevantPosts');
    } else if (this.get('controller.sort') === 'newest' || this.get('controller.sort') === 'oldest') {
      return [this.get('discussion.startPost')];
    } else {
      return [this.get('discussion.lastPost')];
    }
  }),

  didInsertElement: function() {
    this.$('.author').tooltip({ placement: 'right' });
  },

  populateControls: function(items) {
    this.addActionItem(items, 'delete', 'Delete', 'times', 'discussion.canDelete');
  },

  populateInfo: function(items) {
    items.pushObjectWithTag(Ember.Component.extend({
      classNames: ['terminal-post'],
      layoutName: 'components/index/discussion-info/terminal-post',
      discussion: Ember.computed.alias('parent.discussion'),
      displayLastPost: Ember.computed.alias('parent.displayLastPost'),
      parent: this
    }), 'terminalPost');
  },

  actions: {
    // In the template, we render the "controls" dropdown with the contents of
    // the `renderControls` property. This way, when a post is initially
    // rendered, it doesn't have to go to the trouble of rendering the
    // controls right away, which speeds things up. When the dropdown button
    // is clicked, this will fill in the actual controls.
    renderControls: function() {
      this.set('renderControls', this.get('controls'));
    },

    markAsRead: function() {
      var discussion = this.get('discussion');
      if (discussion.get('isUnread')) {
        discussion.set('readNumber', discussion.get('lastPostNumber'));
        discussion.save();
      }
    },

    delete: function() {
      if (confirm('Are you sure you want to delete this discussion?')) {
        var discussion = this.get('discussion');
        discussion.destroyRecord();
        this.sendAction('discussionRemoved', discussion);
      }
    }
  }
});
